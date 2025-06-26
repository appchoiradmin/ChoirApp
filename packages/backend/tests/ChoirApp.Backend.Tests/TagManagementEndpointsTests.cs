using ChoirApp.Application.Dtos;
using ChoirApp.Backend.Endpoints.Songs;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;

namespace ChoirApp.Backend.Tests;

public class TagManagementEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ApplicationDbContext _dbContext;
    private readonly User _testUser;
    private readonly string _authToken;

    public TagManagementEndpointsTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        var scope = _factory.Services.CreateScope();
        _dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Create test user
        _testUser = User.Create("google-123", "Test User", "test@example.com").Value;
        _testUser.PromoteToAdmin();
        _dbContext.Users.Add(_testUser);
        _dbContext.SaveChanges();
        
        // Generate auth token
        _authToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _testUser.UserId, new[] { "SuperAdmin" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _authToken);
    }

    #region AddTagToSong Tests

    [Fact]
    public async Task AddTagToSong_ShouldAddTagSuccessfully_WhenValidRequest()
    {
        // Arrange
        var masterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Amazing Grace",
            Artist = "John Newton",
            LyricsChordPro = "{title: Amazing Grace}\n{artist: John Newton}\n{key: G}\n\n[G]Amazing [C]grace how [G]sweet the sound"
        };
        _dbContext.MasterSongs.Add(masterSong);
        await _dbContext.SaveChangesAsync();

        var request = new AddTagToSongRequest
        {
            SongId = masterSong.SongId,
            TagName = "hymn"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{masterSong.SongId}/tags", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updatedSong = await response.Content.ReadFromJsonAsync<MasterSongDto>();
        updatedSong.Should().NotBeNull();
        updatedSong!.Title.Should().Be("Amazing Grace");
        
        // Verify tag was added to database
        var songInDb = await _dbContext.MasterSongs
            .Include(s => s.SongTags)
            .ThenInclude(st => st.Tag)
            .FirstOrDefaultAsync(s => s.SongId == masterSong.SongId);
        songInDb.Should().NotBeNull();
        songInDb!.SongTags.Should().HaveCount(1);
        songInDb.SongTags.First().Tag!.TagName.Should().Be("hymn");
    }

    [Fact]
    public async Task AddTagToSong_ShouldReturnNotFound_WhenSongDoesNotExist()
    {
        // Arrange
        var nonExistentSongId = Guid.NewGuid();
        var request = new AddTagToSongRequest
        {
            SongId = nonExistentSongId,
            TagName = "nonexistent"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{nonExistentSongId}/tags", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task AddTagToSong_ShouldReturnBadRequest_WhenTagNameIsEmpty()
    {
        // Arrange
        var masterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "{title: Test Song}\n{artist: Test Artist}\n{key: C}\n\n[C]Test lyrics"
        };
        _dbContext.MasterSongs.Add(masterSong);
        await _dbContext.SaveChangesAsync();

        var request = new AddTagToSongRequest
        {
            SongId = masterSong.SongId,
            TagName = ""
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{masterSong.SongId}/tags", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task AddTagToSong_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = null;
        var songId = Guid.NewGuid();
        var request = new AddTagToSongRequest
        {
            SongId = songId,
            TagName = "test"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{songId}/tags", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task AddTagToSong_ShouldReturnForbidden_WhenInsufficientRole()
    {
        // Arrange
        var regularUserToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _testUser.UserId, new[] { "General" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", regularUserToken);
        
        var songId = Guid.NewGuid();
        var request = new AddTagToSongRequest
        {
            SongId = songId,
            TagName = "test"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/mastersongs/{songId}/tags", request);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    #region RemoveTagFromSong Tests

    [Fact]
    public async Task RemoveTagFromSong_ShouldRemoveTagSuccessfully_WhenValidRequest()
    {
        // Arrange
        var masterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "How Great Thou Art",
            Artist = "Carl Boberg",
            LyricsChordPro = "{title: How Great Thou Art}\n{artist: Carl Boberg}\n{key: G}\n\n[G]O Lord my [C]God when [G]I in awesome wonder"
        };
        
        var tag = new Tag
        {
            TagId = Guid.NewGuid(),
            TagName = "worship"
        };
        
        var songTag = new SongTag
        {
            SongId = masterSong.SongId,
            TagId = tag.TagId,
            MasterSong = masterSong,
            Tag = tag
        };
        
        masterSong.SongTags.Add(songTag);
        tag.SongTags.Add(songTag);
        
        _dbContext.MasterSongs.Add(masterSong);
        _dbContext.Tags.Add(tag);
        _dbContext.SongTags.Add(songTag);
        await _dbContext.SaveChangesAsync();

        // Act
        var response = await _client.DeleteAsync($"/api/mastersongs/{masterSong.SongId}/tags/{tag.TagId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Verify tag was removed from database
        _dbContext.ChangeTracker.Clear();
        var songInDb = await _dbContext.MasterSongs
            .Include(s => s.SongTags)
            .FirstOrDefaultAsync(s => s.SongId == masterSong.SongId);
        songInDb.Should().NotBeNull();
        songInDb!.SongTags.Should().BeEmpty();
    }

    [Fact]
    public async Task RemoveTagFromSong_ShouldReturnNotFound_WhenSongDoesNotExist()
    {
        // Arrange
        var nonExistentSongId = Guid.NewGuid();
        var tagId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/mastersongs/{nonExistentSongId}/tags/{tagId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RemoveTagFromSong_ShouldReturnNotFound_WhenTagDoesNotExist()
    {
        // Arrange
        var masterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Song",
            Artist = "Test Artist",
            LyricsChordPro = "{title: Test Song}\n{artist: Test Artist}\n{key: C}\n\n[C]Test lyrics"
        };
        _dbContext.MasterSongs.Add(masterSong);
        await _dbContext.SaveChangesAsync();

        var nonExistentTagId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/mastersongs/{masterSong.SongId}/tags/{nonExistentTagId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RemoveTagFromSong_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = null;
        var songId = Guid.NewGuid();
        var tagId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/mastersongs/{songId}/tags/{tagId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RemoveTagFromSong_ShouldReturnForbidden_WhenInsufficientRole()
    {
        // Arrange
        var regularUserToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _testUser.UserId, new[] { "General" });
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", regularUserToken);
        
        var songId = Guid.NewGuid();
        var tagId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/mastersongs/{songId}/tags/{tagId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    #endregion

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
        _client.Dispose();
    }
}
