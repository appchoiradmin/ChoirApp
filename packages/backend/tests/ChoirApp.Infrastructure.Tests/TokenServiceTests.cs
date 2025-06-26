using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Xunit;

namespace ChoirApp.Infrastructure.Tests;

public class TokenServiceTests
{
    private readonly IConfiguration _configuration;
    private readonly TokenService _tokenService;
    private readonly string _testKey = "super-secret-key-that-is-long-enough-for-testing";
    private readonly string _testIssuer = "test-issuer";
    private readonly string _testAudience = "test-audience";

    public TokenServiceTests()
    {
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = _testKey,
            ["Jwt:Issuer"] = _testIssuer,
            ["Jwt:Audience"] = _testAudience
        };

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        _tokenService = new TokenService(_configuration);
    }

    [Fact]
    public void Constructor_ShouldInitializeSuccessfully_WhenValidConfigurationProvided()
    {
        // Arrange & Act
        var tokenService = new TokenService(_configuration);

        // Assert
        tokenService.Should().NotBeNull();
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidOperationException_WhenJwtKeyIsMissing()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = _testIssuer,
            ["Jwt:Audience"] = _testAudience
            // Missing Jwt:Key
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        // Act & Assert
        var act = () => new TokenService(configuration);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT Issuer, Audience or Key is not configured.");
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidOperationException_WhenJwtIssuerIsMissing()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = _testKey,
            ["Jwt:Audience"] = _testAudience
            // Missing Jwt:Issuer
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        // Act & Assert
        var act = () => new TokenService(configuration);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT Issuer, Audience or Key is not configured.");
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidOperationException_WhenJwtAudienceIsMissing()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = _testKey,
            ["Jwt:Issuer"] = _testIssuer
            // Missing Jwt:Audience
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        // Act & Assert
        var act = () => new TokenService(configuration);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT Issuer, Audience or Key is not configured.");
    }

    [Fact]
    public void Constructor_ShouldThrowInvalidOperationException_WhenJwtKeyIsEmpty()
    {
        // Arrange
        var configData = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "",
            ["Jwt:Issuer"] = _testIssuer,
            ["Jwt:Audience"] = _testAudience
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configData)
            .Build();

        // Act & Assert
        var act = () => new TokenService(configuration);
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("JWT Issuer, Audience or Key is not configured.");
    }

    [Fact]
    public void CreateToken_ShouldReturnValidJwtToken_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert
        token.Should().NotBeNullOrEmpty();
        
        // Verify it's a valid JWT format (3 parts separated by dots)
        var tokenParts = token.Split('.');
        tokenParts.Should().HaveCount(3);
    }

    [Fact]
    public void CreateToken_ShouldIncludeCorrectClaims_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(token);

        // Verify claims
        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.NameId && c.Value == user.UserId.ToString());
        jsonToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
        jsonToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == user.Role.ToString());
    }

    [Fact]
    public void CreateToken_ShouldIncludeCorrectIssuerAndAudience_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(token);

        jsonToken.Issuer.Should().Be(_testIssuer);
        jsonToken.Audiences.Should().Contain(_testAudience);
    }

    [Fact]
    public void CreateToken_ShouldHaveValidExpirationTime_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;
        var beforeTokenCreation = DateTime.Now;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        var jsonToken = tokenHandler.ReadJwtToken(token);

        var afterTokenCreation = DateTime.Now;
        var expectedExpiration = beforeTokenCreation.AddDays(7);
        var maxExpectedExpiration = afterTokenCreation.AddDays(7);

        // JWT ValidTo is in UTC, so convert to local time for comparison
        var tokenExpirationLocal = jsonToken.ValidTo.ToLocalTime();
        
        tokenExpirationLocal.Should().BeOnOrAfter(expectedExpiration.AddSeconds(-1)); // Allow 1 second buffer
        tokenExpirationLocal.Should().BeOnOrBefore(maxExpectedExpiration.AddSeconds(1)); // Allow 1 second buffer
    }

    [Fact]
    public void CreateToken_ShouldBeValidatableWithCorrectKey_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert - Validate the token can be verified with the same key
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_testKey));
        
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = true,
            ValidIssuer = _testIssuer,
            ValidateAudience = true,
            ValidAudience = _testAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // This should not throw an exception
        var act = () => tokenHandler.ValidateToken(token, validationParameters, out _);
        act.Should().NotThrow();
    }

    [Fact]
    public void CreateToken_ShouldNotBeValidatableWithIncorrectKey_WhenValidUserProvided()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token = _tokenService.CreateToken(user);

        // Assert - Validate the token cannot be verified with a different key
        var tokenHandler = new JwtSecurityTokenHandler();
        var wrongKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("wrong-key-for-testing-purposes"));
        
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = wrongKey,
            ValidateIssuer = true,
            ValidIssuer = _testIssuer,
            ValidateAudience = true,
            ValidAudience = _testAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        // This should throw a SecurityTokenInvalidSignatureException
        var act = () => tokenHandler.ValidateToken(token, validationParameters, out _);
        act.Should().Throw<SecurityTokenInvalidSignatureException>();
    }

    [Fact]
    public void CreateToken_ShouldGenerateDifferentTokens_WhenCalledMultipleTimes()
    {
        // Arrange
        var userResult = User.Create("google123", "Test User", "test@example.com");
        var user = userResult.Value;

        // Act
        var token1 = _tokenService.CreateToken(user);
        Thread.Sleep(1000); // Ensure different timestamps
        var token2 = _tokenService.CreateToken(user);

        // Assert
        token1.Should().NotBe(token2);
    }

    [Fact]
    public void CreateToken_ShouldHandleDifferentUserRoles_Correctly()
    {
        // Arrange
        var generalUserResult = User.Create("google123", "General User", "general@example.com");
        var generalUser = generalUserResult.Value;
        
        var adminUserResult = User.Create("google456", "Admin User", "admin@example.com");
        var adminUser = adminUserResult.Value;
        adminUser.PromoteToAdmin(); // Promote to admin role

        // Act
        var generalToken = _tokenService.CreateToken(generalUser);
        var adminToken = _tokenService.CreateToken(adminUser);

        // Assert
        var tokenHandler = new JwtSecurityTokenHandler();
        
        var generalJsonToken = tokenHandler.ReadJwtToken(generalToken);
        var adminJsonToken = tokenHandler.ReadJwtToken(adminToken);

        // Both should have role claims
        generalJsonToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "General");
        adminJsonToken.Claims.Should().Contain(c => c.Type == "role" && c.Value == "ChoirAdmin");
        
        // Tokens should be different
        generalToken.Should().NotBe(adminToken);
    }
}
