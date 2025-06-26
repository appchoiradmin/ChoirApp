using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ChoirApp.Domain.Entities;

namespace ChoirApp.Infrastructure.Tests;

public class ChoirUniquenessCheckerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ChoirUniquenessChecker _checker;

    public ChoirUniquenessCheckerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _checker = new ChoirUniquenessChecker(_context);
    }

    [Fact]
    public async Task IsUnique_ShouldReturnTrue_WhenChoirNameDoesNotExist()
    {
        // Arrange
        var choirName = "Unique Choir";

        // Act
        var isUnique = await _checker.IsUnique(choirName);

        // Assert
        isUnique.Should().BeTrue();
    }

    [Fact]
    public async Task IsUnique_ShouldReturnFalse_WhenChoirNameAlreadyExists()
    {
        // Arrange
        var choirName = "Existing Choir";
        _context.Choirs.Add(Choir.Create(choirName, Guid.NewGuid()).Value);
        await _context.SaveChangesAsync();

        // Act
        var isUnique = await _checker.IsUnique(choirName);

        // Assert
        isUnique.Should().BeFalse();
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
