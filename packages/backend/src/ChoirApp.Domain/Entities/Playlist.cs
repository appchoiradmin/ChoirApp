using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("Playlists")]
    public class Playlist
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("playlist_id")]
        public Guid PlaylistId { get; private set; }

        [Required]
        [Column("name")]
        public string Name { get; private set; } = string.Empty;

        [Column("description")]
        public string? Description { get; private set; }

        [Required]
        [Column("creator_id")]
        public Guid CreatorId { get; private set; }

        [ForeignKey("CreatorId")]
        public User? Creator { get; private set; }

        [Column("choir_id")]
        public Guid? ChoirId { get; private set; }

        [ForeignKey("ChoirId")]
        public Choir? Choir { get; private set; }

        [Required]
        [Column("created_at")]
        public DateTimeOffset CreatedAt { get; private set; } = DateTimeOffset.UtcNow;

        [Required]
        [Column("visibility")]
        public SongVisibilityType Visibility { get; private set; } = SongVisibilityType.Private;

        public ICollection<PlaylistSection> Sections { get; private set; } = new List<PlaylistSection>();
        public ICollection<PlaylistTag> PlaylistTags { get; private set; } = new List<PlaylistTag>();

        private Playlist()
        {
        }

        private Playlist(string name, string? description, Guid creatorId, Guid? choirId, SongVisibilityType visibility, DateTimeOffset? createdAt = null)
        {
            PlaylistId = Guid.NewGuid();
            Name = name;
            Description = description;
            CreatorId = creatorId;
            ChoirId = choirId;
            CreatedAt = createdAt ?? DateTimeOffset.UtcNow;
            Visibility = visibility;
        }

        public static Result<Playlist> Create(string name, string? description, Guid creatorId, Guid? choirId, SongVisibilityType visibility, DateTimeOffset? createdAt = null)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return Result.Fail("Playlist name cannot be empty.");
            }

            if (creatorId == Guid.Empty)
            {
                return Result.Fail("A playlist must have a creator.");
            }

            var playlist = new Playlist(name, description, creatorId, choirId, visibility, createdAt);
            return Result.Ok(playlist);
        }

        public void UpdateName(string newName)
        {
            if (!string.IsNullOrWhiteSpace(newName))
            {
                Name = newName;
            }
        }
        
        // Alias for UpdateName to maintain compatibility with existing code
        public void UpdateTitle(string newTitle)
        {
            UpdateName(newTitle);
        }

        public void UpdateDescription(string? newDescription)
        {
            Description = newDescription;
        }

        public void SetVisibility(SongVisibilityType visibility)
        {
            Visibility = visibility;
        }

        public Result AddSection(string sectionTitle)
        {
            if (string.IsNullOrWhiteSpace(sectionTitle))
            {
                return Result.Fail("Section title cannot be empty.");
            }
            var newSection = PlaylistSection.Create(sectionTitle, PlaylistId, Sections.Count);
            if (newSection.IsFailed)
                return newSection.ToResult();

            Sections.Add(newSection.Value);
            return Result.Ok();
        }
    }
}
