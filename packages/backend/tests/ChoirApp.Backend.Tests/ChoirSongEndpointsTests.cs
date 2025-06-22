using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using ChoirApp.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ChoirApp.Backend.Tests;

public class ChoirSongEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>, IDisposable
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory<Program> _factory;
    private readonly ApplicationDbContext _context;
    private readonly User _adminUser;
    private readonly User _memberUser;
    private readonly Choir _testChoir;
    private readonly MasterSong _testMasterSong;
    private readonly string _adminToken;
    private readonly string _memberToken;

    public ChoirSongEndpointsTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
        
        var scope = _factory.Services.CreateScope();
        _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Create test users
        _adminUser = User.Create("google-admin", "Admin User", "admin@example.com").Value;
        _adminUser.PromoteToAdmin();
        _memberUser = User.Create("google-member", "Member User", "member@example.com").Value;
        // Member user stays as General role
        
        // Create test choir
        _testChoir = Choir.Create("Test Choir", _adminUser.UserId).Value;
        _testChoir.AddMember(_memberUser);
        
        // Create test master song
        _testMasterSong = new MasterSong
        {
            SongId = Guid.NewGuid(),
            Title = "Test Master Song",
            Artist = "Test Artist",
            LyricsChordPro = "{t: Test Master Song}\n[C]Original [G]lyrics [Am]here"
        };
        
        _context.Users.AddRange(_adminUser, _memberUser);
        _context.Choirs.Add(_testChoir);
        _context.MasterSongs.Add(_testMasterSong);
        _context.SaveChanges();
        
        // Generate auth tokens
        _adminToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _adminUser.UserId, new[] { "ChoirAdmin" });
        _memberToken = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", _memberUser.UserId, new[] { "ChoirMember" });
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldCreateVersion_WhenValidDataAndAuthorized()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "{t: Test Master Song}\n[C]Modified [G]lyrics [Am]here [F]with changes"
        };

        // Create the request body that matches the non-route properties of CreateChoirSongVersionRequest
        var requestBody = new { SongDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/choirs/{_testChoir.ChoirId}/songs", requestBody);

        // Debug: capture error details if request fails
        if (response.StatusCode != HttpStatusCode.Created)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error Status: {response.StatusCode}");
            Console.WriteLine($"Error Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdVersion = await response.Content.ReadFromJsonAsync<ChoirSongVersionDto>();
        createdVersion.Should().NotBeNull();
        createdVersion!.MasterSongId.Should().Be(_testMasterSong.SongId);
        createdVersion.ChoirId.Should().Be(_testChoir.ChoirId);
        createdVersion.EditedLyricsChordPro.Should().Be(createDto.EditedLyricsChordPro);
        createdVersion.EditorUserId.Should().Be(_adminUser.UserId);
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldReturnUnauthorized_WhenNotAuthenticated()
    {
        // Arrange
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "[C]Modified lyrics"
        };

        // Act (no auth header)
        var response = await _client.PostAsJsonAsync($"/api/choirs/{_testChoir.ChoirId}/songs", createDto);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetChoirSongVersions_ShouldReturnVersions_WhenVersionsExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        
        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Choir specific lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _adminUser.UserId
        };
        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/choirs/{_testChoir.ChoirId}/songs");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var versions = await response.Content.ReadFromJsonAsync<IEnumerable<ChoirSongVersionDto>>();
        versions.Should().NotBeNull();
        versions.Should().HaveCount(1);
        versions!.First().ChoirId.Should().Be(_testChoir.ChoirId);
    }

    [Fact]
    public async Task GetChoirSongVersionById_ShouldReturnVersion_WhenVersionExists()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        
        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Choir specific lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _adminUser.UserId
        };
        _context.ChoirSongVersions.Add(choirSongVersion);
        await _context.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync($"/api/choirs/{_testChoir.ChoirId}/songs/{choirSongVersion.ChoirSongId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var version = await response.Content.ReadFromJsonAsync<ChoirSongVersionDto>();
        version.Should().NotBeNull();
        version!.MasterSongId.Should().Be(_testMasterSong.SongId);
        version.ChoirId.Should().Be(_testChoir.ChoirId);
        version.EditedLyricsChordPro.Should().Be("[C]Choir specific lyrics");
    }

    [Fact]
    public async Task GetChoirSongVersionById_ShouldReturnNotFound_WhenVersionDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        var nonExistentId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/choirs/{_testChoir.ChoirId}/songs/{nonExistentId}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldReturnBadRequest_WhenMasterSongDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = Guid.NewGuid(), // Non-existent master song
            EditedLyricsChordPro = "[C]Modified lyrics"
        };

        // Create the request body that matches the non-route properties of CreateChoirSongVersionRequest
        var requestBody = new { SongDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/choirs/{_testChoir.ChoirId}/songs", requestBody);

        // Debug: capture error details if request fails
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error Status: {response.StatusCode}");
            Console.WriteLine($"Error Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldReturnBadRequest_WhenChoirDoesNotExist()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        var nonExistentChoirId = Guid.NewGuid();
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "[C]Modified lyrics"
        };

        // Create the request body that matches the non-route properties of CreateChoirSongVersionRequest
        var requestBody = new { SongDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/choirs/{nonExistentChoirId}/songs", requestBody);

        // Debug: capture error details if request fails
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error Status: {response.StatusCode}");
            Console.WriteLine($"Error Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldAllowMemberToCreate_WhenMemberOfChoir()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _memberToken);
        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "[C]Member modified lyrics"
        };

        // Create the request body that matches the non-route properties of CreateChoirSongVersionRequest
        var requestBody = new { SongDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/choirs/{_testChoir.ChoirId}/songs", requestBody);

        // Debug: capture error details if request fails
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error Status: {response.StatusCode}");
            Console.WriteLine($"Error Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var createdVersion = await response.Content.ReadFromJsonAsync<ChoirSongVersionDto>();
        createdVersion.Should().NotBeNull();
        createdVersion!.EditorUserId.Should().Be(_memberUser.UserId);
    }

    [Fact]
    public async Task CreateChoirSongVersion_ShouldReturnConflict_WhenVersionAlreadyExists()
    {
        // Arrange
        _client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _adminToken);
        
        // Create an existing version
        var existingVersion = new ChoirSongVersion
        {
            ChoirSongId = Guid.NewGuid(),
            MasterSongId = _testMasterSong.SongId,
            ChoirId = _testChoir.ChoirId,
            EditedLyricsChordPro = "[C]Existing lyrics",
            LastEditedDate = DateTimeOffset.UtcNow,
            EditorUserId = _adminUser.UserId
        };
        _context.ChoirSongVersions.Add(existingVersion);
        await _context.SaveChangesAsync();

        var createDto = new CreateChoirSongVersionDto
        {
            MasterSongId = _testMasterSong.SongId,
            EditedLyricsChordPro = "[C]New lyrics"
        };

        // Create the request body that matches the non-route properties of CreateChoirSongVersionRequest
        var requestBody = new { SongDto = createDto };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/choirs/{_testChoir.ChoirId}/songs", requestBody);

        // Debug: capture error details if request fails
        if (response.StatusCode != HttpStatusCode.OK)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Error Status: {response.StatusCode}");
            Console.WriteLine($"Error Content: {errorContent}");
        }

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
        _client.Dispose();
    }
}
