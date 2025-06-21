using ChoirApp.Domain.Entities;
using FluentAssertions;
using System;
using Xunit;

namespace ChoirApp.Domain.Tests;

public class ChoirInvitationTests
{
    [Fact]
    public void Create_WithValidInputs_ShouldSucceed()
    {
        // Arrange
        var choirId = Guid.NewGuid();
        var email = "test@example.com";

        // Act
        var result = ChoirInvitation.Create(choirId, email);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var invitation = result.Value;
        invitation.Should().NotBeNull();
        invitation.ChoirId.Should().Be(choirId);
        invitation.Email.Should().Be(email);
        invitation.Status.Should().Be(InvitationStatus.Pending);
        invitation.InvitationToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public void Create_WithEmptyChoirId_ShouldFail()
    {
        // Act
        var result = ChoirInvitation.Create(Guid.Empty, "test@example.com");

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir ID cannot be empty.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("invalid-email")]
    public void Create_WithInvalidEmail_ShouldFail(string? invalidEmail)
    {
        // Act
        var result = ChoirInvitation.Create(Guid.NewGuid(), invalidEmail);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "A valid email is required for an invitation.");
    }

    [Fact]
    public void Accept_WhenPending_ShouldChangeStatusToAccepted()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;

        // Act
        invitation.Accept();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Accepted);
    }

    [Fact]
    public void Accept_WhenAlreadyAccepted_ShouldRemainAccepted()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;
        invitation.Accept();

        // Act
        invitation.Accept();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Accepted);
    }

    [Fact]
    public void Reject_WhenPending_ShouldChangeStatusToRejected()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;

        // Act
        invitation.Reject();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Rejected);
    }

    [Fact]
    public void Reject_WhenAlreadyRejected_ShouldRemainRejected()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;
        invitation.Reject();

        // Act
        invitation.Reject();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Rejected);
    }

    [Fact]
    public void Accept_WhenRejected_ShouldRemainRejected()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;
        invitation.Reject();

        // Act
        invitation.Accept();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Rejected);
    }

    [Fact]
    public void Reject_WhenAccepted_ShouldRemainAccepted()
    {
        // Arrange
        var invitation = ChoirInvitation.Create(Guid.NewGuid(), "test@example.com").Value;
        invitation.Accept();

        // Act
        invitation.Reject();

        // Assert
        invitation.Status.Should().Be(InvitationStatus.Accepted);
    }
}
