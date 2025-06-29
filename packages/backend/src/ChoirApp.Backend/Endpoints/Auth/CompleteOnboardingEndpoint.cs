using ChoirApp.Application.Contracts;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ChoirApp.Backend.Endpoints.Auth;

public class CompleteOnboardingEndpoint : EndpointWithoutRequest
{
    private readonly IUserService _userService;

    public CompleteOnboardingEndpoint(IUserService userService)
    {
        _userService = userService;
    }

    public override void Configure()
    {
        Verbs("POST", "OPTIONS");
        Routes("/auth/complete-onboarding");
        AuthSchemes(JwtBearerDefaults.AuthenticationScheme);
        Roles("General", "ChoirAdmin", "SuperAdmin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            ThrowError("User not authenticated properly.");
            return;
        }

        var result = await _userService.CompleteOnboardingAsync(userId);

        if (result.IsFailed)
        {
            ThrowError(result.Errors.First().Message);
            return;
        }

        await SendOkAsync(ct);
    }
}
