using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistSongTests
{
    [Fact]
    public void PlaylistSong_CanBeCreated_WithValidData()
    {
        // Arrange
        var playlistSongId = Guid.NewGuid();
        var sectionId = Guid.NewGuid();
        var songId = Guid.NewGuid();
        var isMasterSong = true;
        var orderIndex = 1;

        // Act
        var playlistSong = new PlaylistSong
        {
            PlaylistSongId = playlistSongId,
            SectionId = sectionId,
            SongId = songId,
            IsMasterSong = isMasterSong,
            OrderIndex = orderIndex
        };

        // Assert
        playlistSong.Should().NotBeNull();
        playlistSong.PlaylistSongId.Should().Be(playlistSongId);
        playlistSong.SectionId.Should().Be(sectionId);
        playlistSong.SongId.Should().Be(songId);
        playlistSong.IsMasterSong.Should().Be(isMasterSong);
        playlistSong.OrderIndex.Should().Be(orderIndex);
        playlistSong.PlaylistSection.Should().BeNull();
    }
}
