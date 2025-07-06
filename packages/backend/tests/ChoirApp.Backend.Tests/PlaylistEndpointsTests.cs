using ChoirApp.Application.Dtos;
using ChoirApp.Domain.Entities;
using FluentAssertions;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Xunit;
using Microsoft.Extensions.DependencyInjection;
using ChoirApp.Infrastructure.Persistence;
using System;
using System.Linq;

namespace ChoirApp.Backend.Tests
{
    public class PlaylistEndpointsTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly CustomWebApplicationFactory<Program> _factory;

        public PlaylistEndpointsTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task AddSongToPlaylist_ShouldAddSong_WhenRequestIsValid()
        {
            // Arrange
            var client = _factory.CreateClient();
            var token = JwtTokenGenerator.Generate("super-secret-key-that-is-long-enough", Guid.NewGuid(), new[] { "ChoirAdmin" });
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var choir = Choir.Create("Test Choir", Guid.NewGuid()).Value;
            var playlist = Playlist.Create("Test Playlist", choir.ChoirId, true, System.DateTime.Now, null).Value;
            var section = playlist.AddSection("Test Section");
            var song = MasterSong.Create("Test Song", "Test Artist").Value;

            dbContext.Choirs.Add(choir);
            dbContext.Playlists.Add(playlist);
            dbContext.MasterSongs.Add(song);
            await dbContext.SaveChangesAsync();

            var request = new AddSongToPlaylistDto
            {
                SongId = song.Id.ToString(),
                SectionId = playlist.Sections.First().SectionId.ToString()
            };

            // Act
            var response = await client.PostAsJsonAsync($"/api/playlists/{playlist.PlaylistId}/songs", request);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }
    }
}
