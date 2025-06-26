using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class UserChoirTests
{
    [Fact]
    public void UserChoir_CanBeCreated_WithValidData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var choirId = Guid.NewGuid();

        // Act
        var userChoir = new UserChoir
        {
            UserId = userId,
            ChoirId = choirId
        };

        // Assert
        userChoir.Should().NotBeNull();
        userChoir.UserId.Should().Be(userId);
        userChoir.ChoirId.Should().Be(choirId);
        userChoir.User.Should().BeNull();
        userChoir.Choir.Should().BeNull();
    }
}
