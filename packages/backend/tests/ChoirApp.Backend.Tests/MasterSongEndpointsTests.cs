using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace ChoirApp.Backend.Tests;

public class MasterSongEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ApplicationDbContext _context;
    private readonly User _testUser;
    private readonly string _authToken;

    public MasterSongEndpointsTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Create test user
        _testUser = User.Create("google-123", "Test User", "test@example.com").Value;
        _testUser.PromoteToAdmin();
        _context.Users.Add(_testUser);
        _context.SaveChanges();
        
        // Generate auth token
        _authToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _testUser.UserId, new[] { "SuperAdmin" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authToken);
    }

    [Fact]
    public async Task GetAllMasterSongs_ShouldReturnEmptyList_WhenNoSongs()
    {
        // Act
        var response = await _client.GetAsync("/api/mastersongs");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var songs = await response.Content.ReadFromJsonAsync<IEnumerable<MasterSongDto>>();
        songs.Should().NotBeNull();
        songs.Should().BeEmpty();
    }

    [Fact]
    public async Task CreateMasterSong_ShouldReturnCreatedSong_WhenValidData()
    {
        // Arrange
        var createDto = new CreateMasterSongDto
        {
            Title = "Amazing Grace",
            Artist = "John Newton",
            LyricsChordPro = "{t: Amazing Grace}\n[G]Amazing [C]grace, how [G]sweet the [D]sound"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/mastersongs", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var createdSong = await response.Content.ReadFromJsonAsync<MasterSongDto>();
        createdSong.Should().NotBeNull();
        createdSong!.SongId.Should().NotBe(Guid.Empty);
        createdSong.Title.Should().Be(createDto.Title);
        createdSong.Artist.Should().Be(createDto.Artist);
        createdSong.LyricsChordPro.Should().Be(createDto.LyricsChordPro);
    }

    [Fact]
    public async Task GetMasterSongById_ShouldReturnSong_WhenSongExists()
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
        var response = await _client.GetAsync($"/api/mastersongs/{song.SongId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var returnedSong = await response.Content.ReadFromJsonAsync<MasterSongDto>();
        returnedSong.Should().NotBeNull();
        returnedSong!.SongId.Should().Be(song.SongId);
        returnedSong.Title.Should().Be(song.Title);
        returnedSong.Artist.Should().Be(song.Artist);
    }

    [Fact]
    public async Task GetMasterSongById_ShouldReturnNotFound_WhenSongDoesNotExist()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/mastersongs/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task SearchSongs_ShouldReturnMatchingSongs_WhenSearchingByTitle()
    {
        // Arrange
        var song1 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Amazing Grace",
            Artist = "John Newton",
            LyricsChordPro = "[G]Amazing grace"
        };
        var song2 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "How Great Thou Art",
            Artist = "Carl Boberg",
            LyricsChordPro = "[C]How great thou art"
        };
        _context.MasterSongs.AddRange(song1, song2);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/songs/search?title=Amazing");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var searchResults = await response.Content.ReadFromJsonAsync<IEnumerable<MasterSongDto>>();
        searchResults.Should().NotBeNull();
        searchResults.Should().HaveCount(1);
        searchResults!.First().Title.Should().Be("Amazing Grace");
    }

    [Fact]
    public async Task SearchSongs_ShouldReturnMatchingSongs_WhenSearchingByArtist()
    {
        // Arrange
        var song1 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Amazing Grace",
            Artist = "John Newton",
            LyricsChordPro = "[G]Amazing grace"
        };
        var song2 = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Another Song",
            Artist = "John Newton",
            LyricsChordPro = "[C]Another song"
        };
        _context.MasterSongs.AddRange(song1, song2);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/api/songs/search?artist=John Newton");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var searchResults = await response.Content.ReadFromJsonAsync<IEnumerable<MasterSongDto>>();
        searchResults.Should().NotBeNull();
        searchResults.Should().HaveCount(2);
    }

    [Fact]
    public async Task AddTagToSong_ShouldAddTag_WhenValidData()
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

        var addTagRequest = new { TagName = "worship" };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{song.SongId}/tags", addTagRequest);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedSong = await response.Content.ReadFromJsonAsync<MasterSongDto>();
        updatedSong.Should().NotBeNull();
        updatedSong!.Tags.Should().ContainSingle(t => t.TagName == "worship");
    }

    [Fact]
    public async Task CreateMasterSong_ShouldReturnBadRequest_WhenInvalidData()
    {
        // Arrange
        var invalidDto = new CreateMasterSongDto
        {
            Title = "", // Invalid: empty title
            Artist = "Test Artist",
            LyricsChordPro = "[C]Test lyrics"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/mastersongs", invalidDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAllMasterSongs_ShouldReturnAllSongs_WhenSongsExist()
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
        var response = await _client.GetAsync("/api/mastersongs");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var returnedSongs = await response.Content.ReadFromJsonAsync<IEnumerable<MasterSongDto>>();
        returnedSongs.Should().NotBeNull();
        returnedSongs.Should().HaveCount(2);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _client.Dispose();
    }
}
