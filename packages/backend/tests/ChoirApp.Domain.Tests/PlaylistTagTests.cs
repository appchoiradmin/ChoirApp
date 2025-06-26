using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistTagTests
{
    [Fact]
    public void PlaylistTag_CanBeCreated_WithValidData()
    {
        // Arrange
        var playlistId = Guid.NewGuid().ToString();
        var tagId = Guid.NewGuid();

        // Act
        var playlistTag = new PlaylistTag
        {
            PlaylistId = playlistId,
            TagId = tagId
        };

        // Assert
        playlistTag.Should().NotBeNull();
        playlistTag.PlaylistId.Should().Be(playlistId);
        playlistTag.TagId.Should().Be(tagId);
        playlistTag.Playlist.Should().BeNull();
        playlistTag.Tag.Should().BeNull();
    }

    [Fact]
    public void PlaylistTag_PlaylistId_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlistTag = new PlaylistTag();

        // Assert
        playlistTag.PlaylistId.Should().Be(string.Empty);
    }
}
