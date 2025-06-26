using System.Security.Claims;
using ChoirApp.Application.Contracts;
using FastEndpoints;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;

namespace ChoirApp.Backend.Endpoints.Auth;

public class SignInGoogleEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/auth/signin-google");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var properties = new AuthenticationProperties { RedirectUri = "/auth/signin-success" };
        await HttpContext.ChallengeAsync(GoogleDefaults.AuthenticationScheme, properties);
    }
}

public class SignInSuccessEndpoint : EndpointWithoutRequest
{
    public override void Configure()
    {
        Get("/auth/signin-success");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var authenticateResult = await HttpContext.AuthenticateAsync();
        var configuration = Resolve<IConfiguration>();
        var userService = Resolve<IUserService>();
        var tokenService = Resolve<ITokenService>();

        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";

        if (!authenticateResult.Succeeded)
        {
            await SendRedirectAsync($"{frontendUrl}/auth/error?message=Authentication+failed", false, true);
            return;
        }

        var claims = authenticateResult.Principal.Claims;
        var googleId = claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value;
        var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;

        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(name))
        {
            await SendRedirectAsync($"{frontendUrl}/auth/error?message=Could+not+retrieve+user+information+from+Google", false, true);
            return;
        }

        var result = await userService.FindOrCreateUserAsync(googleId, name, email);
        if (result.IsFailed)
        {
            var errorMessage = System.Net.WebUtility.UrlEncode(result.Errors.First().Message);
            await SendRedirectAsync($"{frontendUrl}/auth/error?message={errorMessage}", false, true);
            return;
        }

        var user = result.Value;
        var token = tokenService.CreateToken(user);

        await SendRedirectAsync($"{frontendUrl}/auth/callback?token={token}", false, true);
    }
}
