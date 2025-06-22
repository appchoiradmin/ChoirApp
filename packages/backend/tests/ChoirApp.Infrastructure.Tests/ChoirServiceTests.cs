using ChoirApp.Application.Contracts;
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

public class ChoirServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly IChoirService _choirService;
    private readonly Mock<IChoirUniquenessChecker> _uniquenessCheckerMock;
    private readonly Mock<IUserService> _userServiceMock;
    private readonly User _adminUser;
    private readonly User _memberUser;

    public ChoirServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _uniquenessCheckerMock = new Mock<IChoirUniquenessChecker>();
        _userServiceMock = new Mock<IUserService>();
        _choirService = new ChoirService(_context, _uniquenessCheckerMock.Object, _userServiceMock.Object);

        _adminUser = User.Create("google-admin", "Admin User", "admin@test.com").Value;
        _memberUser = User.Create("google-member", "Member User", "member@test.com").Value;
        _context.Users.AddRange(_adminUser, _memberUser);
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreateChoirAsync_WithUniqueName_ShouldSucceed()
    {
        // Arrange
        var choirDto = new CreateChoirDto { Name = "Test Choir" };
        _uniquenessCheckerMock.Setup(x => x.IsUnique(choirDto.Name)).ReturnsAsync(true);
        _userServiceMock.Setup(x => x.UpdateUserRoleAsync(_adminUser.UserId, UserRole.ChoirAdmin)).ReturnsAsync(FluentResults.Result.Ok());

        // Act
        var result = await _choirService.CreateChoirAsync(choirDto, _adminUser.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choir = result.Value;
        choir.Should().NotBeNull();
        choir.ChoirName.Should().Be(choirDto.Name);
        var choirInDb = await _context.Choirs.FindAsync(choir.ChoirId);
        choirInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateChoirAsync_WithDuplicateName_ShouldFail()
    {
        // Arrange
        var choirDto = new CreateChoirDto { Name = "Test Choir" };
        _uniquenessCheckerMock.Setup(x => x.IsUnique(choirDto.Name)).ReturnsAsync(false);

        // Act
        var result = await _choirService.CreateChoirAsync(choirDto, _adminUser.UserId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "A choir with this name already exists.");
    }

    [Fact]
    public async Task RemoveMemberAsync_WhenAuthorized_ShouldSucceed()
    {
        // Arrange
        var choir = Choir.Create("Test Choir", _adminUser.UserId).Value;
        choir.AddMember(_memberUser);
        _context.Choirs.Add(choir);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirService.RemoveMemberAsync(choir.ChoirId, _memberUser.UserId, _adminUser.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choirInDb = await _context.Choirs.Include(c => c.UserChoirs).FirstAsync();
        choirInDb.UserChoirs.Should().BeEmpty();
    }

    [Fact]
    public async Task UpdateChoirAsync_WhenAuthorizedAndNameIsUnique_ShouldSucceed()
    {
        // Arrange
        var choir = Choir.Create("Old Name", _adminUser.UserId).Value;
        _context.Choirs.Add(choir);
        await _context.SaveChangesAsync();
        var updateDto = new CreateChoirDto { Name = "New Name" };
        _uniquenessCheckerMock.Setup(x => x.IsUnique(updateDto.Name)).ReturnsAsync(true);

        // Act
        var result = await _choirService.UpdateChoirAsync(choir.ChoirId, updateDto, _adminUser.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choirInDb = await _context.Choirs.FindAsync(choir.ChoirId);
        choirInDb?.ChoirName.Should().Be("New Name");
    }

    [Fact]
    public async Task DeleteChoirAsync_WhenAuthorized_ShouldSucceed()
    {
        // Arrange
        var choir = Choir.Create("Test Choir", _adminUser.UserId).Value;
        _context.Choirs.Add(choir);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirService.DeleteChoirAsync(choir.ChoirId, _adminUser.UserId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choirInDb = await _context.Choirs.FindAsync(choir.ChoirId);
        choirInDb.Should().BeNull();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
