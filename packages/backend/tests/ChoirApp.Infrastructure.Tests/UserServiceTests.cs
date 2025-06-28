using ChoirApp.Application.Contracts;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;
using Xunit;

namespace ChoirApp.Infrastructure.Tests;

public class UserServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IUserService _userService;

    public UserServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _userService = new UserService(_context);
    }

    [Fact]
    public async Task FindOrCreateUserAsync_WhenUserDoesNotExist_ShouldCreateAndReturnUser()
    {
        // Arrange
        var googleId = "new-google-id";
        var email = "new.user@example.com";
        var name = "New User";

        // Act
        var result = await _userService.FindOrCreateUserAsync(googleId, name, email);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var user = result.Value;
        user.Should().NotBeNull();
        user.GoogleId.Should().Be(googleId);
        user.Name.Should().Be(name);
        user.Email.Should().Be(email);

        var userInDb = await _context.Users.FindAsync(user.UserId);
        userInDb.Should().NotBeNull();
        userInDb.Should().BeEquivalentTo(user);
    }

    [Fact]
    public async Task FindOrCreateUserAsync_WhenUserExists_ShouldReturnExistingUser()
    {
        // Arrange
        var existingUser = User.Create("existing-google-id", "Existing User", "existing@example.com").Value;
        _context.Users.Add(existingUser);
        await _context.SaveChangesAsync();

        // Act
        var result = await _userService.FindOrCreateUserAsync(existingUser.GoogleId, existingUser.Name, existingUser.Email);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var user = result.Value;
        user.Should().NotBeNull();
        user.UserId.Should().Be(existingUser.UserId);
        _context.Users.Local.Count.Should().Be(1); // No new user should be added
    }
    
    [Fact]
    public async Task FindOrCreateUserAsync_WithInvalidData_ShouldFail()
    {
        // Act
        var result = await _userService.FindOrCreateUserAsync("google-id", "", "email@test.com");

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "User name is required.");
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenUserExists_ShouldUpdateRole()
    {
        // Arrange
        var user = User.Create("google-id", "Test User", "test@example.com").Value;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        user.Role.Should().Be(UserRole.General);

        // Act
        var result = await _userService.UpdateUserRoleAsync(user.UserId, UserRole.ChoirAdmin);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedUser = await _context.Users.FindAsync(user.UserId);
        updatedUser?.Role.Should().Be(UserRole.ChoirAdmin);
    }

    [Fact]
    public async Task UpdateUserRoleAsync_WhenUserDoesNotExist_ShouldFail()
    {
        // Act
        var result = await _userService.UpdateUserRoleAsync(Guid.NewGuid(), UserRole.ChoirAdmin);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message.Contains("not found"));
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var user = User.Create("google-id", "Test User", "test@example.com").Value;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _userService.GetUserByEmailAsync("test@example.com");

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().Be(user.UserId);
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserDoesNotExist_ShouldFail()
    {
        // Act
        var result = await _userService.GetUserByEmailAsync("nonexistent@example.com");

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "User not found.");
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var user = User.Create("google-id", "Test User", "test@example.com").Value;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _userService.GetUserByIdAsync(user.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.UserId.Should().Be(user.UserId);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserDoesNotExist_ShouldFail()
    {
        // Act
        var result = await _userService.GetUserByIdAsync(Guid.NewGuid());

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "User not found.");
    }

    [Fact]
    public async Task CompleteOnboardingAsync_WhenUserExists_ShouldMarkAsCompleted()
    {
        // Arrange
        var user = User.Create("google-id-123", "Test User", "test@example.com").Value;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        
        user.HasCompletedOnboarding.Should().BeFalse();

        // Act
        var result = await _userService.CompleteOnboardingAsync(user.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        
        var updatedUser = await _context.Users.FindAsync(user.UserId);
        updatedUser.Should().NotBeNull();
        updatedUser!.HasCompletedOnboarding.Should().BeTrue();
    }

    [Fact]
    public async Task CompleteOnboardingAsync_WhenUserDoesNotExist_ShouldFail()
    {
        // Act
        var result = await _userService.CompleteOnboardingAsync(Guid.NewGuid());

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle().Which.Message.Should().Contain("not found");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
