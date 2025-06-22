using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace ChoirApp.Infrastructure.Tests;

public class ChoirSongServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly ChoirSongService _choirSongService;
    private readonly Mock<ILogger<ChoirSongService>> _mockLogger;
    private readonly User _testUser;
    private readonly Choir _testChoir;
    private readonly MasterSong _testMasterSong;

    public ChoirSongServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<ChoirSongService>>();
        _choirSongService = new ChoirSongService(_context, _mockLogger.Object);

        // Setup test data
        _testUser = User.Create("google-123", "Test User", "test@example.com").Value;
        _testChoir = Choir.Create("Test Choir", _testUser.UserId).Value;
        _testMasterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Master Song",
            Artist = "Test Artist",
            LyricsChordPro = "{t: Test Master Song}\n[C]Original [G]lyrics"
        };

        _context.Users.Add(_testUser);
        _context.Choirs.Add(_testChoir);
        _context.MasterSongs.Add(_testMasterSong);
        _context.SaveChanges();
    }

    [Fact]
    public async Task CreateChoirSongVersionAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "{t: Test Master Song}\n[C]Modified [G]lyrics [Am]here"
        };

        // Act
        var result = await _choirSongService.CreateChoirSongVersionAsync(_testChoir.ChoirId, _testUser.UserId, createDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var choirSongVersion = result.Value;
        choirSongVersion.Should().NotBeNull();
        choirSongVersion.MasterSongId.Should().Be(_testMasterSong.SongId);
        choirSongVersion.ChoirId.Should().Be(_testChoir.ChoirId);
        choirSongVersion.EditedLyricsChordPro.Should().Be(createDto.EditedLyricsChordPro);
        choirSongVersion.EditorUserId.Should().Be(_testUser.UserId);
        choirSongVersion.LastEditedDate.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));

        // Verify in database
        var versionInDb = await _context.ChoirSongVersions.FindAsync(choirSongVersion.ChoirSongId);
        versionInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateChoirSongVersionAsync_WithNonExistentMasterSong_ShouldFail()
    {
        // Arrange
        var nonExistentSongId = Guid.NewGuid();
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = nonExistentSongId,
            EditedLyricsChordPro = "[C]Modified lyrics"
        };

        // Act
        var result = await _choirSongService.CreateChoirSongVersionAsync(_testChoir.ChoirId, _testUser.UserId, createDto);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Master song not found.");
    }

    [Fact]
    public async Task CreateChoirSongVersionAsync_WithNonExistentChoir_ShouldFail()
    {
        // Arrange
        var nonExistentChoirId = Guid.NewGuid();
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "[C]Modified lyrics"
        };

        // Act
        var result = await _choirSongService.CreateChoirSongVersionAsync(nonExistentChoirId, _testUser.UserId, createDto);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir not found.");
    }

    [Fact]
    public async Task GetChoirSongVersionsAsync_ShouldReturnVersionsForChoir()
    {
        // Arrange
        var choirSongVersion1 = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Version 1 lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _testUser.UserId
        };

        var anotherMasterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Another Song",
            Artist = "Another Artist",
            LyricsChordPro = "[G]Another song"
        };

        var choirSongVersion2 = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = anotherMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[G]Version 2 lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _testUser.UserId
        };

        _context.MasterSongs.Add(anotherMasterSong);
        _context.ChoirSongVersions.AddRange(choirSongVersion1, choirSongVersion2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirSongService.GetChoirSongVersionsAsync(_testChoir.ChoirId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var versions = result.Value;
        versions.Should().HaveCount(2);
        versions.Should().Contain(v => v.ChoirSongId == choirSongVersion1.ChoirSongId);
        versions.Should().Contain(v => v.ChoirSongId == choirSongVersion2.ChoirSongId);
        versions.Should().OnlyContain(v => v.ChoirId == _testChoir.ChoirId);
    }

    [Fact]
    public async Task GetChoirSongVersionsAsync_ShouldReturnEmptyList_WhenNoVersionsExist()
    {
        // Act
        var result = await _choirSongService.GetChoirSongVersionsAsync(_testChoir.ChoirId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task GetChoirSongVersionsAsync_ShouldNotReturnVersionsFromOtherChoirs()
    {
        // Arrange
        var anotherUser = User.Create("google-456", "Another User", "another@example.com").Value;
        var anotherChoir = Choir.Create("Another Choir", anotherUser.UserId).Value;

        var choirSongVersion1 = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Test choir version",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _testUser.UserId
        };

        var choirSongVersion2 = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = anotherChoir.ChoirId,
            EditedLyricsChordPro = "[C]Another choir version",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = anotherUser.UserId
        };

        _context.Users.Add(anotherUser);
        _context.Choirs.Add(anotherChoir);
        _context.ChoirSongVersions.AddRange(choirSongVersion1, choirSongVersion2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirSongService.GetChoirSongVersionsAsync(_testChoir.ChoirId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var versions = result.Value;
        versions.Should().HaveCount(1);
        versions.First().ChoirId.Should().Be(_testChoir.ChoirId);
        versions.First().EditedLyricsChordPro.Should().Be("[C]Test choir version");
    }

    [Fact]
    public async Task GetChoirSongVersionByIdAsync_ShouldReturnVersion_WhenVersionExists()
    {
        // Arrange
        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Test version lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _testUser.UserId
        };

        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirSongService.GetChoirSongVersionByIdAsync(_testChoir.ChoirId, choirSongVersion.ChoirSongId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var version = result.Value;
        version.Should().NotBeNull();
        version.ChoirSongId.Should().Be(choirSongVersion.ChoirSongId);
        version.MasterSongId.Should().Be(_testMasterSong.SongId);
        version.ChoirId.Should().Be(_testChoir.ChoirId);
        version.EditedLyricsChordPro.Should().Be("[C]Test version lyrics");
        version.EditorUserId.Should().Be(_testUser.UserId);
    }

    [Fact]
    public async Task GetChoirSongVersionByIdAsync_ShouldReturnFailure_WhenVersionDoesNotExist()
    {
        // Arrange
        var nonExistentVersionId = Guid.NewGuid();

        // Act
        var result = await _choirSongService.GetChoirSongVersionByIdAsync(_testChoir.ChoirId, nonExistentVersionId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir song version not found.");
    }

    [Fact]
    public async Task GetChoirSongVersionByIdAsync_ShouldReturnFailure_WhenVersionExistsInDifferentChoir()
    {
        // Arrange
        var anotherUser = User.Create("google-456", "Another User", "another@example.com").Value;
        var anotherChoir = Choir.Create("Another Choir", anotherUser.UserId).Value;

        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = anotherChoir.ChoirId, // Different choir
            EditedLyricsChordPro = "[C]Another choir version",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = anotherUser.UserId
        };

        _context.Users.Add(anotherUser);
        _context.Choirs.Add(anotherChoir);
        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        // Act
        var result = await _choirSongService.GetChoirSongVersionByIdAsync(_testChoir.ChoirId, choirSongVersion.ChoirSongId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir song version not found.");
    }

    [Fact]
    public async Task UpdateChoirSongVersionAsync_ShouldUpdateVersion_WhenVersionExists()
    {
        // Arrange
        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Original lyrics",
            LastEditedDate = DateTimeOffset.UtcNow.AddHours(-1),
            EditorUserId = _testUser.UserId
        };

        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        var updateDto = new UpdateChoirSongVersionDto
        {
            EditedLyricsChordPro = "[C]Updated [G]lyrics [Am]here",
            EditorUserId = _testUser.UserId
        };

        // Act
        var result = await _choirSongService.UpdateChoirSongVersionAsync(_testChoir.ChoirId, choirSongVersion.ChoirSongId, updateDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedVersion = result.Value;
        updatedVersion.Should().NotBeNull();
        updatedVersion.EditedLyricsChordPro.Should().Be(updateDto.EditedLyricsChordPro);
        updatedVersion.EditorUserId.Should().Be(updateDto.EditorUserId);
        updatedVersion.LastEditedDate.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));

        // Verify in database
        var versionInDb = await _context.ChoirSongVersions.FindAsync(choirSongVersion.ChoirSongId);
        versionInDb.Should().NotBeNull();
        versionInDb!.EditedLyricsChordPro.Should().Be(updateDto.EditedLyricsChordPro);
    }

    [Fact]
    public async Task UpdateChoirSongVersionAsync_ShouldReturnFailure_WhenVersionDoesNotExist()
    {
        // Arrange
        var nonExistentVersionId = Guid.NewGuid();
        var updateDto = new UpdateChoirSongVersionDto
        {
            EditedLyricsChordPro = "[C]Updated lyrics",
            EditorUserId = _testUser.UserId
        };

        // Act
        var result = await _choirSongService.UpdateChoirSongVersionAsync(_testChoir.ChoirId, nonExistentVersionId, updateDto);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir song version not found.");
    }

    [Fact]
    public async Task UpdateChoirSongVersionAsync_ShouldReturnFailure_WhenVersionExistsInDifferentChoir()
    {
        // Arrange
        var anotherUser = User.Create("google-456", "Another User", "another@example.com").Value;
        var anotherChoir = Choir.Create("Another Choir", anotherUser.UserId).Value;

        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = anotherChoir.ChoirId, // Different choir
            EditedLyricsChordPro = "[C]Original lyrics",
            LastEditedDate = DateTimeOffset.UtcNow.AddHours(-1),
            EditorUserId = anotherUser.UserId
        };

        _context.Users.Add(anotherUser);
        _context.Choirs.Add(anotherChoir);
        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        var updateDto = new UpdateChoirSongVersionDto
        {
            EditedLyricsChordPro = "[C]Updated lyrics",
            EditorUserId = _testUser.UserId
        };

        // Act
        var result = await _choirSongService.UpdateChoirSongVersionAsync(_testChoir.ChoirId, choirSongVersion.ChoirSongId, updateDto);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Choir song version not found.");
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
