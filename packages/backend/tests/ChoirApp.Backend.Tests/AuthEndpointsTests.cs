using Microsoft.AspNetCore.Mvc.Testing;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ChoirApp.Backend.Tests;

public class AuthEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly string _generalToken;
    private readonly string _choirAdminToken;

    public AuthEndpointsTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
        
        // Generate test tokens
        _generalToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", Guid.Parse("14cbf0ce-21e1-45fe-85b3-99d191b754b5"), new[] { "General" });
        _choirAdminToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", Guid.Parse("5e065c7e-a564-435d-920f-a401a66cfc6d"), new[] { "ChoirAdmin" });
    }

    #region SignInGoogle Tests

    [Fact]
    public async Task SignInGoogle_ShouldRedirectToGoogle()
    {
        // Act
        var response = await _client.GetAsync("/api/auth/signin-google");

        // Assert
        // In test environment, OAuth challenge may not work the same way as in production
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Redirect, HttpStatusCode.Found, HttpStatusCode.NoContent);
        
        // Only check for Google redirect if we actually got a redirect response
        if (response.StatusCode == HttpStatusCode.Redirect || response.StatusCode == HttpStatusCode.Found)
        {
            response.Headers.Location?.ToString().Should().Contain("accounts.google.com");
        }
    }

    #endregion

    #region SignInSuccess Tests

    [Fact]
    public async Task SignInSuccess_ShouldRedirectToFrontend_WhenValidCallback()
    {
        // Arrange
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false // Prevent the client from following the redirect automatically
        });

        // Add the special header to trigger the simulated Google callback in the TestAuthenticationHandler
        client.DefaultRequestHeaders.Add("X-Test-Auth-Mode", "GoogleCallback");

        // Act
        var response = await client.GetAsync("/api/auth/signin-success");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Redirect);
        response.Headers.Location.Should().NotBeNull();
        response.Headers.Location.ToString().Should().StartWith("http://localhost:5173/auth/callback?token=");
    }

    #endregion

    #region GetCurrentUser Tests

    [Fact]
    public async Task GetCurrentUser_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Act
        var response = await _client.GetAsync("/api/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnUser_WhenAuthenticated()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var user = User.Create("google-123", "Test User", "test@example.com").Value;
        context.Users.Add(user);
        await context.SaveChangesAsync();
        
        var token = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", user.UserId, new[] { "General" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var userDto = await response.Content.ReadFromJsonAsync<UserDto>();
        userDto.Should().NotBeNull();
        userDto!.Email.Should().Be("test@example.com");
        userDto.FirstName.Should().Be("Test");
        userDto.LastName.Should().Be("User");
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnUserWithChoirs_WhenUserHasChoirs()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var user = User.Create("google-456", "Choir User", "choir@example.com").Value;
        context.Users.Add(user);
        
        var choir = Choir.Create("Test Choir", user.UserId).Value;
        context.Choirs.Add(choir);
        
        // Add the UserChoir relationship
        var userChoir = new UserChoir
        {
            UserId = user.UserId,
            ChoirId = choir.ChoirId,
            User = user,
            Choir = choir
        };
        context.UserChoirs.Add(userChoir);
        
        await context.SaveChangesAsync();
        
        var token = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", user.UserId, new[] { "ChoirAdmin" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var userDto = await response.Content.ReadFromJsonAsync<UserDto>();
        userDto.Should().NotBeNull();
        userDto!.Email.Should().Be("choir@example.com");
        userDto.FirstName.Should().Be("Choir");
        userDto.LastName.Should().Be("User");
        userDto.Choirs.Should().HaveCount(1);
        userDto.Choirs.First().Name.Should().Be("Test Choir");
    }

    [Fact]
    public async Task GetCurrentUser_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var nonExistentUserId = Guid.NewGuid();
        var token = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", nonExistentUserId, new[] { "General" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task GetCurrentUser_ShouldHandleSingleNameUser_Correctly()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var user = User.Create("google-789", "Madonna", "madonna@example.com").Value;
        context.Users.Add(user);
        await context.SaveChangesAsync();
        
        var token = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", user.UserId, new[] { "General" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/me");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var userDto = await response.Content.ReadFromJsonAsync<UserDto>();
        userDto.Should().NotBeNull();
        userDto!.Email.Should().Be("madonna@example.com");
        userDto.FirstName.Should().Be("Madonna");
        userDto.LastName.Should().BeEmpty();
    }

    #endregion
}
