using System.Security.Claims;
using ChoirApp.Application.Contracts;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication;

namespace ChoirApp.Backend.Endpoints.Auth;

// Note: OAuth signin is handled by AuthController for proper redirect support
// FastEndpoints doesn't handle OAuth challenges as well as traditional controllers

public class SignInSuccessEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/auth/signin-success");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var authenticateResult = await HttpContext.AuthenticateAsync();
            var configuration = Resolve<IConfiguration>();
            var userService = Resolve<IUserService>();
            var tokenService = Resolve<ITokenService>();

            var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";

            if (!authenticateResult.Succeeded)
            {
                var errorMessage = authenticateResult.Failure?.Message ?? "Authentication failed";
                await SendRedirectAsync($"{frontendUrl}/auth/error?message={Uri.EscapeDataString(errorMessage)}", false, true);
                return;
            }

            var claims = authenticateResult.Principal?.Claims;
            if (claims == null)
            {
                await SendRedirectAsync($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("No user claims found")}", false, true);
                return;
            }

            var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

            if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(name))
            {
                await SendRedirectAsync($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("Could not retrieve user information from Google")}", false, true);
                return;
            }

            var result = await userService.FindOrCreateUserAsync(googleId, name, email);
            if (result.IsFailed)
            {
                var errorMessage = Uri.EscapeDataString(result.Errors.First().Message);
                await SendRedirectAsync($"{frontendUrl}/auth/error?message={errorMessage}", false, true);
                return;
            }

            var user = result.Value;
            var token = tokenService.CreateToken(user);

            if (string.IsNullOrEmpty(token))
            {
                await SendRedirectAsync($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("Failed to create authentication token")}", false, true);
                return;
            }

            await SendRedirectAsync($"{frontendUrl}/auth/callback?token={token}", false, true);
        }
        catch (Exception ex)
        {
            var configuration = Resolve<IConfiguration>();
            var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";
            var errorMessage = Uri.EscapeDataString($"Internal server error: {ex.Message}");
            await SendRedirectAsync($"{frontendUrl}/auth/error?message={errorMessage}", false, true);
        }
    }
}
