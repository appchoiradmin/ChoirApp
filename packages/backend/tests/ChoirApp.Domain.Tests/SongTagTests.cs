using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class SongTagTests
{
    [Fact]
    public void SongTag_CanBeCreated_WithValidData()
    {
        // Arrange
        var songId = Guid.NewGuid();
        var tagId = Guid.NewGuid();

        // Act
        var songTag = new SongTag
        {
            SongId = songId,
            TagId = tagId
        };

        // Assert
        songTag.Should().NotBeNull();
        songTag.SongId.Should().Be(songId);
        songTag.TagId.Should().Be(tagId);
        songTag.MasterSong.Should().BeNull();
        songTag.Tag.Should().BeNull();
    }
}
