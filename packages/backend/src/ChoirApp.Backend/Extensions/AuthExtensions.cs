using System.Text;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Hosting;

namespace ChoirApp.Backend.Extensions;

public static class AuthExtensions
{
    public static IServiceCollection AddAuth(this IServiceCollection services, IConfiguration configuration, IWebHostEnvironment environment)
    {
        var jwtKey = configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey))
        {
            throw new InvalidOperationException("JWT Key is not configured.");
        }

        var googleClientId = configuration["Authentication:Google:ClientId"];
        var googleClientSecret = configuration["Authentication:Google:ClientSecret"];
        if (string.IsNullOrEmpty(googleClientId) || string.IsNullOrEmpty(googleClientSecret))
        {
            throw new InvalidOperationException("Google authentication is not configured.");
        }

        services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                if (environment.IsDevelopment())
                {
                    options.Cookie.SameSite = SameSiteMode.Lax;
                    options.Cookie.SecurePolicy = CookieSecurePolicy.None;
                    options.Cookie.HttpOnly = true;
                    options.Cookie.Path = "/";
                }
            })
            .AddJwtBearer(options =>
            {
                options.SaveToken = true;
                options.RequireHttpsMetadata = false;
                options.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidAudience = configuration["Jwt:Audience"],
                    ValidIssuer = configuration["Jwt:Issuer"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            })
            .AddGoogle(options =>
            {
                options.ClientId = googleClientId;
                options.ClientSecret = googleClientSecret;
                options.CallbackPath = "/api/auth/google-callback";
                
                // Add required scopes explicitly
                options.Scope.Add("openid");
                options.Scope.Add("profile");
                options.Scope.Add("email");

                if (environment.IsDevelopment())
                {
                    options.CorrelationCookie.SameSite = SameSiteMode.Lax;
                    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.None;
                    options.CorrelationCookie.Path = "/";
                    options.CorrelationCookie.HttpOnly = true;
                    
                    // Additional settings to help with correlation issues
                    options.Events.OnRemoteFailure = context =>
                    {
                        var errorMessage = Uri.EscapeDataString(context.Failure?.Message ?? "Authentication failed");
                        context.Response.Redirect($"/auth/error?message={errorMessage}");
                        context.HandleResponse();
                        return Task.CompletedTask;
                    };
                }
                else
                {
                    // Production settings
                    options.CorrelationCookie.SameSite = SameSiteMode.None;
                    options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
                    options.CorrelationCookie.Path = "/";
                    options.CorrelationCookie.HttpOnly = true;
                }
            });
            
        return services;
    }
}
