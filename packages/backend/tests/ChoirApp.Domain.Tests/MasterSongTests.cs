using ChoirApp.Domain.Entities;
using Xunit;
using FluentAssertions;

namespace ChoirApp.Domain.Tests;

public class MasterSongTests
{
    [Fact]
    public void MasterSong_CanBeCreated_WithValidData()
    {
        // Arrange
        var songId = Guid.NewGuid();
        var title = "Amazing Grace";
        var artist = "John Newton";
        var lyricsChordPro = "{title: Amazing Grace}\n{artist: John Newton}\nAmazing grace! How sweet the sound";

        // Act
        var masterSong = new MasterSong
        {
            SongId = songId,
            Title = title,
            Artist = artist,
            LyricsChordPro = lyricsChordPro
        };

        // Assert
        masterSong.Should().NotBeNull();
        masterSong.SongId.Should().Be(songId);
        masterSong.Title.Should().Be(title);
        masterSong.Artist.Should().Be(artist);
        masterSong.LyricsChordPro.Should().Be(lyricsChordPro);
        masterSong.SongTags.Should().BeEmpty();
        masterSong.ChoirSongVersions.Should().BeEmpty();
    }

    [Fact]
    public void MasterSong_Title_IsInitializedToEmptyString()
    {
        // Arrange & Act
        var masterSong = new MasterSong();

        // Assert
        masterSong.Title.Should().Be(string.Empty);
    }
}
