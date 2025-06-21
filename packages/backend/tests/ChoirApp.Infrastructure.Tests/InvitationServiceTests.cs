using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Domain.Services;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using System;
using System.Threading.Tasks;
using Xunit;

namespace ChoirApp.Infrastructure.Tests;

public class InvitationServiceTests
{
    private readonly DbContextOptions<ApplicationDbContext> _dbContextOptions;

    public InvitationServiceTests()
    {
        _dbContextOptions = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    private ApplicationDbContext CreateContext() => new ApplicationDbContext(_dbContextOptions);

    [Fact]
    public async Task CreateInvitationAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        var context = CreateContext();
        var mockPolicy = new Mock<IInvitationPolicy>();
        var service = new InvitationService(context, mockPolicy.Object);

        var admin = User.Create("admin_google_id", "admin", "admin@test.com").Value;
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        context.Users.Add(admin);
        context.Choirs.Add(choir);
        await context.SaveChangesAsync();

        mockPolicy.Setup(p => p.CanBeCreated(choir.ChoirId, "new@member.com")).ReturnsAsync(true);

        var dto = new InviteUserDto { ChoirId = choir.ChoirId, Email = "new@member.com" };

        // Act
        var result = await service.CreateInvitationAsync(dto, admin.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var invitation = await context.ChoirInvitations.FirstOrDefaultAsync();
        invitation.Should().NotBeNull();
        invitation!.Email.Should().Be("new@member.com");
        invitation.Status.Should().Be(InvitationStatus.Pending);
    }

    [Fact]
    public async Task AcceptInvitationAsync_WithValidToken_ShouldSucceedAndAddMember()
    {
        // Arrange
        var context = CreateContext();
        var mockPolicy = new Mock<IInvitationPolicy>();
        var service = new InvitationService(context, mockPolicy.Object);

        var admin = User.Create("admin_google_id", "admin", "admin@test.com").Value;
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        var invitee = User.Create("invitee_google_id", "invitee", "invitee@test.com").Value;
        var invitation = ChoirInvitation.Create(choir.ChoirId, invitee.Email).Value;

        context.Users.AddRange(admin, invitee);
        context.Choirs.Add(choir);
        context.ChoirInvitations.Add(invitation);
        await context.SaveChangesAsync();

        var dto = new AcceptInvitationDto { InvitationToken = invitation.InvitationToken };

        // Act
        var result = await service.AcceptInvitationAsync(dto, invitee.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var acceptedInvitation = await context.ChoirInvitations.FindAsync(invitation.InvitationId);
        acceptedInvitation.Should().NotBeNull();
        acceptedInvitation!.Status.Should().Be(InvitationStatus.Accepted);

        var choirFromDb = await context.Choirs.Include(c => c.UserChoirs).FirstAsync();
        choirFromDb.UserChoirs.Should().Contain(uc => uc.UserId == invitee.UserId);
    }

    [Fact]
    public async Task RejectInvitationAsync_WithValidToken_ShouldSucceed()
    {
        // Arrange
        var context = CreateContext();
        var mockPolicy = new Mock<IInvitationPolicy>();
        var service = new InvitationService(context, mockPolicy.Object);

        var admin = User.Create("admin_google_id", "admin", "admin@test.com").Value;
        var choir = Choir.Create("Test Choir", admin.UserId).Value;
        var invitee = User.Create("invitee_google_id", "invitee", "invitee@test.com").Value;
        var invitation = ChoirInvitation.Create(choir.ChoirId, invitee.Email).Value;

        context.Users.AddRange(admin, invitee);
        context.Choirs.Add(choir);
        context.ChoirInvitations.Add(invitation);
        await context.SaveChangesAsync();

        var dto = new RejectInvitationDto { InvitationToken = invitation.InvitationToken };

        // Act
        var result = await service.RejectInvitationAsync(dto, invitee.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var rejectedInvitation = await context.ChoirInvitations.FindAsync(invitation.InvitationId);
        rejectedInvitation.Should().NotBeNull();
        rejectedInvitation!.Status.Should().Be(InvitationStatus.Rejected);
    }
}
