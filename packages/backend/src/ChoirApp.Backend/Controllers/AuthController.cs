using ChoirApp.Application.Contracts;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChoirApp.Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ILogger<AuthController> _logger;

    public AuthController(ILogger<AuthController> logger)
    {
        _logger = logger;
    }

    [HttpGet("signin-google")]
    [AllowAnonymous]
    public IActionResult SignInGoogle()
    {
        _logger.LogInformation("Initiating Google OAuth signin");
        
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/api/auth/signin-success"
        };

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google-callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        var authenticateResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        if (!authenticateResult.Succeeded)
        {
            return Redirect("/auth/error?message=Authentication failed");
        }

        // Redirect to the frontend application
        return RedirectToAction(nameof(SignInSuccess));
    }

    [HttpGet("signin-success")]
    public async Task<IActionResult> SignInSuccess()
    {
        var authenticateResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        var configuration = HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var userService = HttpContext.RequestServices.GetRequiredService<IUserService>();
        var tokenService = HttpContext.RequestServices.GetRequiredService<ITokenService>();

        var frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:5173";

        if (!authenticateResult.Succeeded)
        {
            var errorMessage = authenticateResult.Failure?.Message ?? "Authentication failed";
            return Redirect($"{frontendUrl}/auth/error?message={Uri.EscapeDataString(errorMessage)}");
        }

        var claims = authenticateResult.Principal?.Claims;
        if (claims == null)
        {
            return Redirect($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("No user claims found")}");
        }

        var googleId = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value;

        if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(name))
        {
            return Redirect($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("Could not retrieve user information from Google")}");
        }

        var result = await userService.FindOrCreateUserAsync(googleId, name, email);
        if (result.IsFailed)
        {
            var errorMessage = Uri.EscapeDataString(result.Errors.First().Message);
            return Redirect($"{frontendUrl}/auth/error?message={errorMessage}");
        }

        var user = result.Value;
        var token = tokenService.CreateToken(user);

        if (string.IsNullOrEmpty(token))
        {
            return Redirect($"{frontendUrl}/auth/error?message={Uri.EscapeDataString("Failed to create authentication token")}");
        }

        // Check if this is a new user and redirect accordingly
        var redirectUrl = user.IsNewUser()
            ? $"{frontendUrl}/auth/callback?isNewUser=true&token={token}"
            : $"{frontendUrl}/auth/callback?token={token}";
        return Redirect(redirectUrl);
    }
}
