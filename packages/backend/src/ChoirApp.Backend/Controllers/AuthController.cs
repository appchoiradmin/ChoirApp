using Microsoft.AspNetCore.Authentication;
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
}
