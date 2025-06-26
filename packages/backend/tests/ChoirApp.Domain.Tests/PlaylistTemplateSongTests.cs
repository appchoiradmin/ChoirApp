using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistTemplateSongTests
{
    [Fact]
    public void PlaylistTemplateSong_CanBeCreated_WithValidData()
    {
        // Arrange
        var templateSongId = Guid.NewGuid();
        var templateSectionId = Guid.NewGuid();
        var songId = Guid.NewGuid();
        var isMasterSong = true;
        var orderIndex = 1;

        // Act
        var playlistTemplateSong = new PlaylistTemplateSong
        {
            TemplateSongId = templateSongId,
            TemplateSectionId = templateSectionId,
            SongId = songId,
            IsMasterSong = isMasterSong,
            OrderIndex = orderIndex
        };

        // Assert
        playlistTemplateSong.Should().NotBeNull();
        playlistTemplateSong.TemplateSongId.Should().Be(templateSongId);
        playlistTemplateSong.TemplateSectionId.Should().Be(templateSectionId);
        playlistTemplateSong.SongId.Should().Be(songId);
        playlistTemplateSong.IsMasterSong.Should().Be(isMasterSong);
        playlistTemplateSong.OrderIndex.Should().Be(orderIndex);
        playlistTemplateSong.PlaylistTemplateSection.Should().BeNull();
    }
}
