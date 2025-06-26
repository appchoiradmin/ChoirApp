using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;
using System;

namespace ChoirApp.Domain.Tests;

public class ChoirSongVersionTests
{
    [Fact]
    public void ChoirSongVersion_CanBeCreated_WithValidData()
    {
        // Arrange
        var choirSongId = Guid.NewGuid();
        var masterSongId = Guid.NewGuid();
        var choirId = Guid.NewGuid();
        var editedLyricsChordPro = "{title: Edited Song}\nEdited lyrics content";
        var lastEditedDate = DateTimeOffset.UtcNow;
        var editorUserId = Guid.NewGuid();

        // Act
        var choirSongVersion = new ChoirSongVersion
        {
            ChoirSongId = choirSongId,
            MasterSongId = masterSongId,
            ChoirId = choirId,
            EditedLyricsChordPro = editedLyricsChordPro,
            LastEditedDate = lastEditedDate,
            EditorUserId = editorUserId
        };

        // Assert
        choirSongVersion.Should().NotBeNull();
        choirSongVersion.ChoirSongId.Should().Be(choirSongId);
        choirSongVersion.MasterSongId.Should().Be(masterSongId);
        choirSongVersion.ChoirId.Should().Be(choirId);
        choirSongVersion.EditedLyricsChordPro.Should().Be(editedLyricsChordPro);
        choirSongVersion.LastEditedDate.Should().Be(lastEditedDate);
        choirSongVersion.EditorUserId.Should().Be(editorUserId);
        choirSongVersion.MasterSong.Should().BeNull(); // Navigation property should be null in unit test
        choirSongVersion.Choir.Should().BeNull();     // Navigation property should be null in unit test
        choirSongVersion.Editor.Should().BeNull();    // Navigation property should be null in unit test
    }
}

