using ChoirApp.Domain.Entities;
using FluentAssertions;

namespace ChoirApp.Domain.Tests;

public class UserTests
{
    [Fact]
    public void Create_WithValidInputs_ShouldSucceed()
    {
        // Act
        var result = User.Create("google-id-123", "Test User", "test@example.com");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var user = result.Value;
        user.Should().NotBeNull();
        user.GoogleId.Should().Be("google-id-123");
        user.Name.Should().Be("Test User");
        user.Email.Should().Be("test@example.com");
        user.Role.Should().Be(UserRole.General);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithInvalidGoogleId_ShouldFail(string? invalidGoogleId)
    {
        // Act
        var result = User.Create(invalidGoogleId!, "Test User", "test@example.com");

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Google ID is required.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void Create_WithInvalidName_ShouldFail(string? invalidName)
    {
        // Act
        var result = User.Create("google-id-123", invalidName!, "test@example.com");

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "User name is required.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("invalid-email")]
    public void Create_WithInvalidEmail_ShouldFail(string? invalidEmail)
    {
        // Act
        var result = User.Create("google-id-123", "Test User", invalidEmail!);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "A valid email is required.");
    }

    [Fact]
    public void PromoteToAdmin_WhenRoleIsGeneral_ShouldChangeRoleToChoirAdmin()
    {
        // Arrange
        var user = User.Create("google-id-123", "Test User", "test@example.com").Value;

        // Act
        user.PromoteToAdmin();

        // Assert
        user.Role.Should().Be(UserRole.ChoirAdmin);
    }
    
    [Fact]
    public void PromoteToAdmin_WhenRoleIsAlreadyChoirAdmin_ShouldRemainChoirAdmin()
    {
        // Arrange
        var user = User.Create("google-id-123", "Test User", "test@example.com").Value;
        user.PromoteToAdmin(); // Promote once

        // Act
        user.PromoteToAdmin(); // Promote again

        // Assert
        user.Role.Should().Be(UserRole.ChoirAdmin);
    }

    [Fact]
    public void DemoteToGeneral_WhenRoleIsChoirAdmin_ShouldChangeRoleToGeneral()
    {
        // Arrange
        var user = User.Create("google-id-123", "Test User", "test@example.com").Value;
        user.PromoteToAdmin();

        // Act
        user.DemoteToGeneral();

        // Assert
        user.Role.Should().Be(UserRole.General);
    }

    [Fact]
    public void DemoteToGeneral_WhenRoleIsAlreadyGeneral_ShouldRemainGeneral()
    {
        // Arrange
        var user = User.Create("google-id-123", "Test User", "test@example.com").Value;

        // Act
        user.DemoteToGeneral();

        // Assert
        user.Role.Should().Be(UserRole.General);
    }
}
