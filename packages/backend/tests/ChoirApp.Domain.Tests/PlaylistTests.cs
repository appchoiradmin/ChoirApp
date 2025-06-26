using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class PlaylistTests
{
    [Fact]
    public void Playlist_CanBeCreated_WithValidData()
    {
        // Arrange
        var playlistId = Guid.NewGuid().ToString();
        var choirId = Guid.NewGuid();
        var title = "Sunday Service Playlist";
        var description = "Songs for the upcoming Sunday service.";
        var creationDate = DateTimeOffset.UtcNow;
        var lastModifiedDate = DateTimeOffset.UtcNow;
        var isPublic = true;

        // Act
        var playlist = new Playlist
        {
            PlaylistId = playlistId,
            ChoirId = choirId,
            Title = title,
            Description = description,
            CreationDate = creationDate,
            LastModifiedDate = lastModifiedDate,
            IsPublic = isPublic
        };

        // Assert
        playlist.Should().NotBeNull();
        playlist.PlaylistId.Should().Be(playlistId);
        playlist.ChoirId.Should().Be(choirId);
        playlist.Title.Should().Be(title);
        playlist.Description.Should().Be(description);
        playlist.CreationDate.Should().Be(creationDate);
        playlist.LastModifiedDate.Should().Be(lastModifiedDate);
        playlist.IsPublic.Should().Be(isPublic);
        playlist.Choir.Should().BeNull();
        playlist.PlaylistTemplate.Should().BeNull();
        playlist.PlaylistSections.Should().BeEmpty();
        playlist.PlaylistTags.Should().BeEmpty();
    }

    [Fact]
    public void Playlist_Title_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlist = new Playlist();

        // Assert
        playlist.Title.Should().Be(string.Empty);
    }

    [Fact]
    public void Playlist_PlaylistId_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var playlist = new Playlist();

        // Assert
        playlist.PlaylistId.Should().Be(string.Empty);
    }
}
