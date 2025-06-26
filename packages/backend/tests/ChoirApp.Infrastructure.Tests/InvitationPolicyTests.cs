using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using System;
using System.Threading.Tasks;

namespace ChoirApp.Infrastructure.Tests;

public class InvitationPolicyTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly InvitationPolicy _policy;

    public InvitationPolicyTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _policy = new InvitationPolicy(_context);
    }

    [Fact]
    public async Task CanBeCreated_ShouldReturnTrue_WhenNoPendingInvitationExists()
    {
        // Arrange
        var choirId = Guid.NewGuid();
        var email = "test@example.com";

        // Act
        var canBeCreated = await _policy.CanBeCreated(choirId, email);

        // Assert
        canBeCreated.Should().BeTrue();
    }

    [Fact]
    public async Task CanBeCreated_ShouldReturnFalse_WhenPendingInvitationExists()
    {
        // Arrange
        var choirId = Guid.NewGuid();
        var email = "test@example.com";
        _context.ChoirInvitations.Add(ChoirInvitation.Create(choirId, email).Value);
        await _context.SaveChangesAsync();

        // Act
        var canBeCreated = await _policy.CanBeCreated(choirId, email);

        // Assert
        canBeCreated.Should().BeFalse();
    }

    [Fact]
    public async Task CanBeCreated_ShouldReturnTrue_WhenRejectedInvitationExists()
    {
        // Arrange
        var choirId = Guid.NewGuid();
        var email = "test@example.com";
        var rejectedInvitation = ChoirInvitation.Create(choirId, email).Value;
        rejectedInvitation.Reject(); // Set status to rejected
        _context.ChoirInvitations.Add(rejectedInvitation);
        await _context.SaveChangesAsync();

        // Act
        var canBeCreated = await _policy.CanBeCreated(choirId, email);

        // Assert
        canBeCreated.Should().BeTrue();
    }

    [Fact]
    public async Task CanBeCreated_ShouldReturnTrue_WhenAcceptedInvitationExists()
    {
        // Arrange
        var choirId = Guid.NewGuid();
        var email = "test@example.com";
        var acceptedInvitation = ChoirInvitation.Create(choirId, email).Value;
        acceptedInvitation.Accept(); // Set status to accepted
        _context.ChoirInvitations.Add(acceptedInvitation);
        await _context.SaveChangesAsync();

        // Act
        var canBeCreated = await _policy.CanBeCreated(choirId, email);

        // Assert
        canBeCreated.Should().BeTrue();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
