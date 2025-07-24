using ChoirApp.Application.Contracts;
using ChoirApp.Application.Dtos;
using FastEndpoints;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.PushNotifications;

[HttpPost("push-subscriptions"), Authorize]
public class CreatePushSubscriptionEndpoint : Endpoint<CreatePushSubscriptionDto>
{
    private readonly IPushNotificationService _pushNotificationService;

    public CreatePushSubscriptionEndpoint(IPushNotificationService pushNotificationService)
    {
        _pushNotificationService = pushNotificationService;
    }

    public override async Task HandleAsync(CreatePushSubscriptionDto req, CancellationToken ct)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        var result = await _pushNotificationService.CreateSubscriptionAsync(req, userId);

        if (result.IsSuccess)
        {
            await SendOkAsync(ct);
        }
        else
        {
            await SendAsync(new { errors = result.Errors.Select(e => e.Message) }, 400, ct);
        }
    }
}
