using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Text.Json;
using System.Threading.Tasks;
using WebPush;

namespace ChoirApp.Infrastructure.Services
{
    public class WebPushNotificationProvider : IPushNotificationProvider
    {
        private readonly ILogger<WebPushNotificationProvider> _logger;
        private readonly WebPushClient _webPushClient;
        private readonly VapidDetails? _vapidDetails;
        private readonly bool _isConfigured;

        public WebPushNotificationProvider(
            ILogger<WebPushNotificationProvider> logger,
            IConfiguration configuration)
        {
            _logger = logger;
            _webPushClient = new WebPushClient();

            // Configure VAPID details from configuration
            var vapidSubject = configuration["PushNotifications:VapidSubject"] ?? "mailto:admin@choirapp.com";
            var vapidPublicKey = configuration["PushNotifications:VapidPublicKey"];
            var vapidPrivateKey = configuration["PushNotifications:VapidPrivateKey"];

            if (string.IsNullOrEmpty(vapidPublicKey) || string.IsNullOrEmpty(vapidPrivateKey))
            {
                _logger.LogWarning("VAPID keys not configured. Push notifications will not work.");
                _isConfigured = false;
                _vapidDetails = null;
            }
            else
            {
                _vapidDetails = new VapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
                _isConfigured = true;
                _logger.LogInformation("Push notification provider configured successfully.");
            }
        }

        public async Task<Result> SendNotificationAsync(ChoirApp.Domain.Entities.PushSubscription subscription, PushNotificationDto notification)
        {
            if (!_isConfigured || _vapidDetails == null)
            {
                _logger.LogWarning("Push notifications not configured. Cannot send notification.");
                return Result.Fail("Push notifications not configured.");
            }

            try
            {
                var webPushSubscription = new WebPush.PushSubscription(
                    subscription.Endpoint,
                    subscription.P256dhKey,
                    subscription.AuthKey);

                var payload = JsonSerializer.Serialize(new
                {
                    title = notification.Title,
                    body = notification.Body,
                    icon = notification.Icon,
                    badge = notification.Badge,
                    url = notification.Url,
                    data = notification.Data
                });

                await _webPushClient.SendNotificationAsync(webPushSubscription, payload, _vapidDetails);
                
                _logger.LogInformation("Push notification sent successfully to endpoint {Endpoint}", 
                    subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length)) + "...");
                
                return Result.Ok();
            }
            catch (WebPushException ex)
            {
                _logger.LogError(ex, "WebPush error sending notification to endpoint {Endpoint}: {StatusCode} - {Message}", 
                    subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length)) + "...", 
                    ex.StatusCode, 
                    ex.Message);

                // Handle specific error cases
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone || 
                    ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return Result.Fail("Subscription expired or invalid");
                }

                return Result.Fail($"Failed to send push notification: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error sending push notification to endpoint {Endpoint}", 
                    subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length)) + "...");
                
                return Result.Fail("Failed to send push notification due to unexpected error.");
            }
        }

        public Task<bool> IsConfiguredAsync()
        {
            return Task.FromResult(_isConfigured);
        }
    }
}
