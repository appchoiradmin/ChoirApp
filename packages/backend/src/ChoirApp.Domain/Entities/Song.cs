using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using FluentResults;

namespace ChoirApp.Domain.Entities;

public enum SongVisibilityType
{
    Private,
    PublicAll,
    PublicChoirs
}

[Table("Songs")]
public class Song
{
    [Key]
    [Column("song_id")]
    public Guid SongId { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("artist")]
    public string? Artist { get; set; }

    [Required]
    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Required]
    [Column("creator_id")]
    public Guid CreatorId { get; set; }

    [ForeignKey("CreatorId")]
    public User? Creator { get; set; }

    [Required]
    [Column("created_at")]
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    [Required]
    [Column("version_number")]
    public int VersionNumber { get; set; } = 1;

    [Column("base_song_id")]
    public Guid? BaseSongId { get; set; }

    [ForeignKey("BaseSongId")]
    public Song? BaseSong { get; set; }

    [Required]
    [Column("visibility")]
    public SongVisibilityType Visibility { get; set; } = SongVisibilityType.Private;

    public ICollection<Song> Derivatives { get; set; } = new List<Song>();
    public ICollection<SongVisibility> Visibilities { get; set; } = new List<SongVisibility>();
    public ICollection<SongTag> Tags { get; set; } = new List<SongTag>();

    // Factory method for creating a new song (version 1)
    public static Result<Song> Create(string title, string? artist, string content, Guid creatorId, SongVisibilityType visibility)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return Result.Fail("Song title cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return Result.Fail("Song content cannot be empty.");
        }

        if (creatorId == Guid.Empty)
        {
            return Result.Fail("Creator ID cannot be empty.");
        }

        var song = new Song
        {
            SongId = Guid.NewGuid(),
            Title = title,
            Artist = artist,
            Content = content,
            CreatorId = creatorId,
            CreatedAt = DateTimeOffset.UtcNow,
            VersionNumber = 1,
            BaseSongId = null,
            Visibility = visibility
        };

        return Result.Ok(song);
    }

    // Factory method for creating a new version of an existing song
    public static Result<Song> CreateVersion(Song baseSong, string content, Guid creatorId, SongVisibilityType visibility)
    {
        if (baseSong == null)
        {
            return Result.Fail("Base song cannot be null.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return Result.Fail("Song content cannot be empty.");
        }

        if (creatorId == Guid.Empty)
        {
            return Result.Fail("Creator ID cannot be empty.");
        }

        var song = new Song
        {
            SongId = Guid.NewGuid(),
            Title = baseSong.Title,
            Artist = baseSong.Artist,
            Content = content,
            CreatorId = creatorId,
            CreatedAt = DateTimeOffset.UtcNow,
            VersionNumber = baseSong.VersionNumber + 1,
            BaseSongId = baseSong.SongId,
            Visibility = visibility
        };

        return Result.Ok(song);
    }

    // Method to update song content (only allowed for the creator)
    public Result Update(string title, string? artist, string content, Guid userId)
    {
        if (userId != CreatorId)
        {
            return Result.Fail("Only the creator can update this song.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            return Result.Fail("Song title cannot be empty.");
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return Result.Fail("Song content cannot be empty.");
        }

        Title = title;
        Artist = artist;
        Content = content;

        return Result.Ok();
    }

    // Method to update song visibility (only allowed for the creator)
    public Result UpdateVisibility(SongVisibilityType visibility, Guid userId)
    {
        if (userId != CreatorId)
        {
            return Result.Fail("Only the creator can update this song's visibility.");
        }

        Visibility = visibility;
        return Result.Ok();
    }
}
