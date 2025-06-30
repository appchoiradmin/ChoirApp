using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ChoirApp.Backend.Tests;

public class ChoirEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ApplicationDbContext _context;
    private readonly User _adminUser;
    private readonly User _memberUser;
    private readonly User _generalUser;
    private readonly string _adminToken;
    private readonly string _memberToken;
    private readonly string _generalToken;

    public ChoirEndpointsTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Create test users with different roles
        _adminUser = User.Create("google-admin", "Admin User", "admin@example.com").Value;
        _adminUser.PromoteToAdmin();
        
        _memberUser = User.Create("google-member", "Member User", "member@example.com").Value;
        // Member stays as General role
        
        _generalUser = User.Create("google-general", "General User", "general@example.com").Value;
        // General user stays as General role
        
        _context.Users.AddRange(_adminUser, _memberUser, _generalUser);
        _context.SaveChanges();
        
        // Generate auth tokens
        _adminToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _adminUser.UserId, new[] { "ChoirAdmin" });
        _memberToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _memberUser.UserId, new[] { "General" });
        _generalToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _generalUser.UserId, new[] { "General" });
    }

    #region Create Choir Tests

    [Fact]
    public async Task CreateChoir_ShouldCreateChoir_WhenValidDataAndAuthenticated()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var createDto = new CreateChoirDto
        {
            Name = "Amazing Grace Choir"
        };
        // Send the DTO directly, not wrapped in an object

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdChoir = await response.Content.ReadFromJsonAsync<ChoirDto>();
        createdChoir.Should().NotBeNull();
        createdChoir!.Name.Should().Be("Amazing Grace Choir");
        createdChoir.AdminId.Should().Be(_adminUser.UserId);
        createdChoir.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateChoir_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        var createDto = new CreateChoirDto { Name = "Test Choir" };
        var request = new { ChoirDto = createDto };

        // Act (no auth header)
        var response = await _client.PostAsJsonAsync("/api/choirs", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateChoir_ShouldReturnBadRequest_WhenInvalidData()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var createDto = new CreateChoirDto
        {
            Name = "" // Invalid - empty name
        };
        var request = new { ChoirDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Get Choir Tests

    [Fact]
    public async Task GetChoir_ShouldReturnChoir_WhenChoirExists()
    {
        // Arrange
        var choir = await SeedTestChoir();

        // Act
        var response = await _client.GetAsync($"/api/choirs/{choir.ChoirId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var returnedChoir = await response.Content.ReadFromJsonAsync<ChoirDto>();
        returnedChoir.Should().NotBeNull();
        returnedChoir!.Id.Should().Be(choir.ChoirId);
        returnedChoir.Name.Should().Be(choir.ChoirName);
        returnedChoir.AdminId.Should().Be(choir.AdminUserId);
    }

    [Fact]
    public async Task GetChoir_ShouldReturnNotFound_WhenChoirDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/choirs/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    #endregion

    #region Update Choir Tests

    [Fact]
    public async Task UpdateChoir_ShouldUpdateChoir_WhenValidDataAndAuthorized()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var choir = await SeedTestChoir();
        var updateDto = new CreateChoirDto
        {
            Name = "Updated Choir Name"
        };
        var request = new { Dto = updateDto };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/choirs/{choir.ChoirId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify update
        var getResponse = await _client.GetAsync($"/api/choirs/{choir.ChoirId}");
        var updatedChoir = await getResponse.Content.ReadFromJsonAsync<ChoirDto>();
        updatedChoir!.Name.Should().Be("Updated Choir Name");
    }

    [Fact]
    public async Task UpdateChoir_ShouldReturnBadRequest_WhenChoirDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var nonExistentId = Guid.NewGuid();
        var updateDto = new CreateChoirDto { Name = "Updated Name" };
        var request = new { Dto = updateDto };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/choirs/{nonExistentId}", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Delete Choir Tests

    [Fact]
    public async Task DeleteChoir_ShouldDeleteChoir_WhenChoirExistsAndAuthorized()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var choir = await SeedTestChoir();

        // Act
        var response = await _client.DeleteAsync($"/api/choirs/{choir.ChoirId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);
        
        // Verify deletion
        var getResponse = await _client.GetAsync($"/api/choirs/{choir.ChoirId}");
        getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DeleteChoir_ShouldReturnBadRequest_WhenChoirDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/choirs/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Invite User Tests

    [Fact]
    public async Task InviteUser_ShouldSendInvitation_WhenValidDataAndAuthorized()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var choir = await SeedTestChoir();
        var inviteDto = new InviteUserDto
        {
            Email = "newmember@example.com",
            ChoirId = choir.ChoirId
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs/invitations", inviteDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task InviteUser_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        var choir = await SeedTestChoir();
        var inviteDto = new InviteUserDto
        {
            Email = "test@example.com",
            ChoirId = choir.ChoirId
        };

        // Act (no auth header)
        var response = await _client.PostAsJsonAsync("/api/choirs/invitations", inviteDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task InviteUser_ShouldReturnForbidden_WhenNotChoirAdmin()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        var choir = await SeedTestChoir();
        var inviteDto = new InviteUserDto
        {
            Email = "test@example.com",
            ChoirId = choir.ChoirId
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs/invitations", inviteDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Accept/Reject Invitation Tests

    [Fact]
    public async Task AcceptInvitation_ShouldReturnBadRequest_WhenInvalidToken()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _generalToken);
        var acceptDto = new AcceptInvitationDto
        {
            InvitationToken = "invalid-token"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs/invitations/accept", acceptDto);

        // Assert - The endpoint returns 400 BadRequest when invitation service fails with invalid token
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RejectInvitation_ShouldReturnBadRequest_WhenInvalidToken()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _generalToken);
        var rejectDto = new RejectInvitationDto
        {
            InvitationToken = "invalid-token"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/choirs/invitations/reject", rejectDto);

        // Assert - The endpoint returns 400 BadRequest when invitation service fails with invalid token
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Remove Member Tests

    [Fact]
    public async Task RemoveMember_ShouldReturnBadRequest_WhenMemberDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var choir = await SeedTestChoir();
        var nonExistentMemberId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/choirs/{choir.ChoirId}/members/{nonExistentMemberId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RemoveMember_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        var choir = await SeedTestChoir();
        var memberId = Guid.NewGuid();

        // Act (no auth header)
        var response = await _client.DeleteAsync($"/api/choirs/{choir.ChoirId}/members/{memberId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RemoveMember_ShouldReturnForbidden_WhenNotChoirAdmin()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        var choir = await SeedTestChoir();
        var memberId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/choirs/{choir.ChoirId}/members/{memberId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region Update Member Role Tests

    [Fact]
    public async Task UpdateMemberRole_ShouldUpdateRole_WhenValidDataAndAuthorized()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var choir = await SeedTestChoir();
        // Add a non-admin member to the choir for this test
        var addMemberResult = choir.AddMember(_memberUser, false);
        addMemberResult.IsSuccess.Should().BeTrue();
        await _context.SaveChangesAsync();
        var member = choir.UserChoirs.First(uc => uc.UserId == _memberUser.UserId);
        var updateDto = new UpdateMemberRoleRequest
        {
            Role = "Admin"
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/choirs/{choir.ChoirId}/members/{member.UserId}/role", updateDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Detach tracked UserChoir entity to force fresh read from database
        var local = _context.UserChoirs.Local.FirstOrDefault(uc => uc.UserId == member.UserId && uc.ChoirId == choir.ChoirId);
        if (local != null)
        {
            _context.Entry(local).State = EntityState.Detached;
        }
        // Verify update
        var updatedMember = await _context.UserChoirs.FirstOrDefaultAsync(uc => uc.UserId == member.UserId && uc.ChoirId == choir.ChoirId);
        updatedMember.Should().NotBeNull();
        updatedMember!.IsAdmin.Should().BeTrue();
    }

    #endregion

    #region Helper Methods

    private async Task<Choir> SeedTestChoir()
    {
        var choir = Choir.Create("Test Choir", _adminUser.UserId).Value;
        _context.Choirs.Add(choir);
        await _context.SaveChangesAsync();
        return choir;
    }

    #endregion

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _client.Dispose();
    }
}
