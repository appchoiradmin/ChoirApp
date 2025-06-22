using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using ChoirApp.Infrastructure.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace ChoirApp.Infrastructure.Tests;

public class MasterSongServiceTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly MasterSongService _masterSongService;

    public MasterSongServiceTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new ApplicationDbContext(options);
        _masterSongService = new MasterSongService(_context);
    }

    [Fact]
    public async Task CreateMasterSongAsync_WithValidData_ShouldSucceed()
    {
        // Arrange
        var createDto = new CreateMasterSongDto
        {
            Title = "Amazing Grace",
            Artist = "John Newton",
            LyricsChordPro = "{t: Amazing Grace}\n[G]Amazing [C]grace",
            Tags = new List<string> { "worship", "hymn" }
        };

        // Act
        var result = await _masterSongService.CreateMasterSongAsync(createDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var song = result.Value;
        song.Should().NotBeNull();
        song.Title.Should().Be(createDto.Title);
        song.Artist.Should().Be(createDto.Artist);
        song.LyricsChordPro.Should().Be(createDto.LyricsChordPro);
        song.Tags.Should().HaveCount(2);
        song.Tags.Should().Contain(t => t.TagName == "worship");
        song.Tags.Should().Contain(t => t.TagName == "hymn");

        // Verify in database
        var songInDb = await _context.MasterSongs.FindAsync(song.SongId);
        songInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateMasterSongAsync_WithExistingTags_ShouldReuseExistingTags()
    {
        // Arrange
        var existingTag = new Tag { TagId = Guid.NewGuid(), TagName = "worship" };
        _context.Tags.Add(existingTag);
        await _context.SaveChangesAsync();

        var createDto = new CreateMasterSongDto
        {
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics",
            Tags = new List<string> { "worship", "new-tag" }
        };

        // Act
        var result = await _masterSongService.CreateMasterSongAsync(createDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var song = result.Value;
        song.Tags.Should().HaveCount(2);
        song.Tags.Should().Contain(t => t.TagName == "worship" && t.TagId == existingTag.TagId);
        song.Tags.Should().Contain(t => t.TagName == "new-tag");

        // Verify only one new tag was created
        var tagsInDb = await _context.Tags.CountAsync();
        tagsInDb.Should().Be(2); // existing + new
    }

    [Fact]
    public async Task CreateMasterSongAsync_ShouldNormalizeTagNames()
    {
        // Arrange
        var createDto = new CreateMasterSongDto
        {
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics",
            Tags = new List<string> { "  WORSHIP  ", "Hymn" }
        };

        // Act
        var result = await _masterSongService.CreateMasterSongAsync(createDto);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var song = result.Value;
        song.Tags.Should().HaveCount(2);
        song.Tags.Should().Contain(t => t.TagName == "worship");
        song.Tags.Should().Contain(t => t.TagName == "hymn");
    }

    [Fact]
    public async Task GetAllMasterSongsAsync_ShouldReturnAllSongs()
    {
        // Arrange
        var songs = new[]
        {
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 1",
                Artist = "Artist 1",
                LyricsChordPro = "[C]Song 1 lyrics"
            },
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 2",
                Artist = "Artist 2",
                LyricsChordPro = "[G]Song 2 lyrics"
            }
        };
        _context.MasterSongs.AddRange(songs);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.GetAllMasterSongsAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        var returnedSongs = result.Value;
        returnedSongs.Should().HaveCount(2);
        returnedSongs.Should().Contain(s => s.Title == "Song 1");
        returnedSongs.Should().Contain(s => s.Title == "Song 2");
    }

    [Fact]
    public async Task GetAllMasterSongsAsync_ShouldReturnEmptyList_WhenNoSongs()
    {
        // Act
        var result = await _masterSongService.GetAllMasterSongsAsync();

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMasterSongByIdAsync_ShouldReturnSong_WhenSongExists()
    {
        // Arrange
        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        _context.MasterSongs.Add(song);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.GetMasterSongByIdAsync(song.SongId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var returnedSong = result.Value;
        returnedSong.Should().NotBeNull();
        returnedSong.SongId.Should().Be(song.SongId);
        returnedSong.Title.Should().Be(song.Title);
        returnedSong.Artist.Should().Be(song.Artist);
    }

    [Fact]
    public async Task GetMasterSongByIdAsync_ShouldReturnFailure_WhenSongDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await _masterSongService.GetMasterSongByIdAsync(nonExistentId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Master song not found.");
    }

    [Fact]
    public async Task AddTagToSongAsync_ShouldAddNewTag_WhenTagDoesNotExist()
    {
        // Arrange
        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        _context.MasterSongs.Add(song);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.AddTagToSongAsync(song.SongId, "worship");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedSong = result.Value;
        updatedSong.Tags.Should().ContainSingle(t => t.TagName == "worship");

        // Verify tag was created in database
        var tagInDb = await _context.Tags.FirstOrDefaultAsync(t => t.TagName == "worship");
        tagInDb.Should().NotBeNull();
    }

    [Fact]
    public async Task AddTagToSongAsync_ShouldReuseExistingTag_WhenTagExists()
    {
        // Arrange
        var existingTag = new Tag { TagId = Guid.NewGuid(), TagName = "worship" };
        _context.Tags.Add(existingTag);

        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        _context.MasterSongs.Add(song);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.AddTagToSongAsync(song.SongId, "worship");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedSong = result.Value;
        updatedSong.Tags.Should().ContainSingle(t => t.TagName == "worship" && t.TagId == existingTag.TagId);

        // Verify no duplicate tag was created
        var tagsInDb = await _context.Tags.CountAsync(t => t.TagName == "worship");
        tagsInDb.Should().Be(1);
    }

    [Fact]
    public async Task AddTagToSongAsync_ShouldNotAddDuplicateTag_WhenTagAlreadyOnSong()
    {
        // Arrange
        var tag = new Tag { TagId = Guid.NewGuid(), TagName = "worship" };
        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        var songTag = new SongTag { SongId = song.SongId, TagId = tag.TagId };

        _context.Tags.Add(tag);
        _context.MasterSongs.Add(song);
        _context.SongTags.Add(songTag);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.AddTagToSongAsync(song.SongId, "worship");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var updatedSong = result.Value;
        updatedSong.Tags.Should().ContainSingle(t => t.TagName == "worship");

        // Verify no duplicate song-tag relationship was created
        var songTagsInDb = await _context.SongTags.CountAsync(st => st.SongId == song.SongId && st.TagId == tag.TagId);
        songTagsInDb.Should().Be(1);
    }

    [Fact]
    public async Task RemoveTagFromSongAsync_ShouldRemoveTag_WhenTagExistsOnSong()
    {
        // Arrange
        var tag = new Tag { TagId = Guid.NewGuid(), TagName = "worship" };
        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        var songTag = new SongTag { SongId = song.SongId, TagId = tag.TagId };

        _context.Tags.Add(tag);
        _context.MasterSongs.Add(song);
        _context.SongTags.Add(songTag);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.RemoveTagFromSongAsync(song.SongId, tag.TagId);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().BeTrue();

        // Verify tag was removed from song
        var songTagInDb = await _context.SongTags.FirstOrDefaultAsync(st => st.SongId == song.SongId && st.TagId == tag.TagId);
        songTagInDb.Should().BeNull();
    }

    [Fact]
    public async Task RemoveTagFromSongAsync_ShouldReturnFailure_WhenTagNotOnSong()
    {
        // Arrange
        var song = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };
        _context.MasterSongs.Add(song);
        await _context.SaveChangesAsync();

        var nonExistentTagId = Guid.NewGuid();

        // Act
        var result = await _masterSongService.RemoveTagFromSongAsync(song.SongId, nonExistentTagId);

        // Assert
        result.IsFailed.Should().BeTrue();
        result.Errors.Should().ContainSingle(e => e.Message == "Tag not found on song.");
    }

    [Fact]
    public async Task SearchSongsAsync_ShouldReturnMatchingSongs_WhenSearchingByTitle()
    {
        // Arrange
        var songs = new[]
        {
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Amazing Grace",
                Artist = "John Newton",
                LyricsChordPro = "[G]Amazing grace"
            },
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "How Great Thou Art",
                Artist = "Carl Boberg",
                LyricsChordPro = "[C]How great"
            }
        };
        _context.MasterSongs.AddRange(songs);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.SearchSongsAsync("Amazing", null, null);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var searchResults = result.Value;
        searchResults.Should().HaveCount(1);
        searchResults.First().Title.Should().Be("Amazing Grace");
    }

    [Fact]
    public async Task SearchSongsAsync_ShouldReturnMatchingSongs_WhenSearchingByArtist()
    {
        // Arrange
        var songs = new[]
        {
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 1",
                Artist = "John Newton",
                LyricsChordPro = "[G]Song 1"
            },
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 2",
                Artist = "John Newton",
                LyricsChordPro = "[C]Song 2"
            },
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 3",
                Artist = "Other Artist",
                LyricsChordPro = "[D]Song 3"
            }
        };
        _context.MasterSongs.AddRange(songs);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.SearchSongsAsync(null, "John Newton", null);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var searchResults = result.Value;
        searchResults.Should().HaveCount(2);
        searchResults.Should().OnlyContain(s => s.Artist == "John Newton");
    }

    [Fact]
    public async Task SearchSongsAsync_ShouldReturnMatchingSongs_WhenSearchingByTag()
    {
        // Arrange
        var worshipTag = new Tag { TagId = Guid.NewGuid(), TagName = "worship" };
        var hymnTag = new Tag { TagId = Guid.NewGuid(), TagName = "hymn" };

        var song1 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Worship Song",
            Artist = "Artist 1",
            LyricsChordPro = "[G]Worship lyrics"
        };
        var song2 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Hymn Song",
            Artist = "Artist 2",
            LyricsChordPro = "[C]Hymn lyrics"
        };

        _context.Tags.AddRange(worshipTag, hymnTag);
        _context.MasterSongs.AddRange(song1, song2);
        _context.SongTags.AddRange(
            new SongTag { SongId = song1.SongId, TagId = worshipTag.TagId },
            new SongTag { SongId = song2.SongId, TagId = hymnTag.TagId }
        );
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.SearchSongsAsync(null, null, "worship");

        // Assert
        result.IsSuccess.Should().BeTrue();
        var searchResults = result.Value;
        searchResults.Should().HaveCount(1);
        searchResults.First().Title.Should().Be("Worship Song");
    }

    [Fact]
    public async Task SearchSongsAsync_ShouldReturnAllSongs_WhenNoSearchCriteria()
    {
        // Arrange
        var songs = new[]
        {
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 1",
                Artist = "Artist 1",
                LyricsChordPro = "[G]Song 1"
            },
            new MasterSong
            {
                SongId = Guid.NewGuid(),
                Title = "Song 2",
                Artist = "Artist 2",
                LyricsChordPro = "[C]Song 2"
            }
        };
        _context.MasterSongs.AddRange(songs);
        await _context.SaveChangesAsync();

        // Act
        var result = await _masterSongService.SearchSongsAsync(null, null, null);

        // Assert
        result.IsSuccess.Should().BeTrue();
        var searchResults = result.Value;
        searchResults.Should().HaveCount(2);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
