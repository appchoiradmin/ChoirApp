using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistSectionTests
{
    [Fact]
    public void PlaylistSection_CanBeCreated_WithValidData()
    {
        // Arrange
        var sectionId = Guid.NewGuid();
        var playlistId = Guid.NewGuid().ToString();
        var title = "Warm-up Songs";
        var orderIndex = 1;

        // Act
        var playlistSection = new PlaylistSection
        {
            SectionId = sectionId,
            PlaylistId = playlistId,
            Title = title,
            OrderIndex = orderIndex
        };

        // Assert
        playlistSection.Should().NotBeNull();
        playlistSection.SectionId.Should().Be(sectionId);
        playlistSection.PlaylistId.Should().Be(playlistId);
        playlistSection.Title.Should().Be(title);
        playlistSection.OrderIndex.Should().Be(orderIndex);
        playlistSection.Playlist.Should().BeNull();
        playlistSection.PlaylistSongs.Should().BeEmpty();
    }

    [Fact]
    public void PlaylistSection_Title_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlistSection = new PlaylistSection();

        // Assert
        playlistSection.Title.Should().Be(string.Empty);
    }

    [Fact]
    public void PlaylistSection_PlaylistId_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlistSection = new PlaylistSection();

        // Assert
        playlistSection.PlaylistId.Should().Be(string.Empty);
    }
}
