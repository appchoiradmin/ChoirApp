using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentResults;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ChoirApp.Application.Services
{
    public class PushNotificationService : IPushNotificationService
    {
        private readonly IPushSubscriptionRepository _pushSubscriptionRepository;
        private readonly IUserRepository _userRepository;
        private readonly IPushNotificationProvider _pushNotificationProvider;
        private readonly ILogger<PushNotificationService> _logger;

        public PushNotificationService(
            IPushSubscriptionRepository pushSubscriptionRepository,
            IUserRepository userRepository,
            IPushNotificationProvider pushNotificationProvider,
            ILogger<PushNotificationService> logger)
        {
            _pushSubscriptionRepository = pushSubscriptionRepository;
            _userRepository = userRepository;
            _pushNotificationProvider = pushNotificationProvider;
            _logger = logger;
        }

        public async Task<Result> CreateSubscriptionAsync(CreatePushSubscriptionDto subscriptionDto, Guid userId)
        {
            try
            {
                // Check if subscription already exists for this endpoint
                var existingSubscription = await _pushSubscriptionRepository.GetByEndpointAsync(subscriptionDto.Endpoint);
                if (existingSubscription != null)
                {
                    // Reactivate if it was deactivated
                    if (!existingSubscription.IsActive)
                    {
                        existingSubscription.Reactivate();
                        await _pushSubscriptionRepository.UpdateAsync(existingSubscription);
                        await _pushSubscriptionRepository.SaveChangesAsync();
                    }
                    return Result.Ok();
                }

                // Create new subscription
                var subscriptionResult = PushSubscription.Create(
                    userId,
                    subscriptionDto.Endpoint,
                    subscriptionDto.P256dhKey,
                    subscriptionDto.AuthKey);

                if (subscriptionResult.IsFailed)
                {
                    return Result.Fail(subscriptionResult.Errors);
                }

                await _pushSubscriptionRepository.AddAsync(subscriptionResult.Value);
                await _pushSubscriptionRepository.SaveChangesAsync();
                return Result.Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating push subscription for user {UserId}", userId);
                return Result.Fail("Failed to create push subscription.");
            }
        }

        public async Task<Result> SendNotificationToUserAsync(Guid userId, PushNotificationDto notification)
        {
            try
            {
                var subscriptions = await _pushSubscriptionRepository.GetActiveByUserIdAsync(userId);
                if (!subscriptions.Any())
                {
                    _logger.LogInformation("No active push subscriptions found for user {UserId}", userId);
                    return Result.Ok(); // Not an error - user just doesn't have push notifications enabled
                }

                var successCount = 0;
                foreach (var subscription in subscriptions)
                {
                    var result = await _pushNotificationProvider.SendNotificationAsync(subscription, notification);
                    
                    if (result.IsSuccess)
                    {
                        subscription.MarkAsUsed();
                        await _pushSubscriptionRepository.UpdateAsync(subscription);
                        successCount++;
                    }
                    else if (result.Errors.Any(e => e.Message.Contains("expired") || e.Message.Contains("invalid")))
                    {
                        // Deactivate expired/invalid subscriptions
                        subscription.Deactivate();
                        await _pushSubscriptionRepository.UpdateAsync(subscription);
                    }
                }

                await _pushSubscriptionRepository.SaveChangesAsync();

                // Return success if at least one notification was sent successfully
                if (successCount > 0)
                {
                    return Result.Ok();
                }

                return Result.Fail("Failed to send notifications to any subscriptions.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
                return Result.Fail("Failed to send push notification.");
            }
        }

        public async Task<Result> SendChoirInvitationNotificationAsync(Guid userId, string choirName, string inviterName)
        {
            var notification = new PushNotificationDto
            {
                Title = "Choir Invitation",
                Body = $"{inviterName} has invited you to join {choirName}",
                Icon = "/icons/icon-192x192.png",
                Badge = "/icons/icon-72x72.png",
                Url = "/dashboard",
                Data = new { type = "choir_invitation", choirName, inviterName }
            };

            return await SendNotificationToUserAsync(userId, notification);
        }

        public async Task<Result> RemoveSubscriptionAsync(string endpoint)
        {
            try
            {
                var subscription = await _pushSubscriptionRepository.GetByEndpointAsync(endpoint);
                if (subscription == null)
                {
                    return Result.Ok(); // Already removed
                }

                await _pushSubscriptionRepository.DeleteAsync(subscription);
                await _pushSubscriptionRepository.SaveChangesAsync();
                return Result.Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing push subscription with endpoint {Endpoint}", endpoint);
                return Result.Fail("Failed to remove push subscription.");
            }
        }
    }
}
