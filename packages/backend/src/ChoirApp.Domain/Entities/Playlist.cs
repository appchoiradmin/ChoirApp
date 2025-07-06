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

        [Column("title")]
        public string? Title { get; private set; }

        [Required]
        [Column("is_public")]
        public bool IsPublic { get; private set; }

        [Required]
        [Column("creation_date")]
        public DateTimeOffset CreationDate { get; private set; }

        [Required]
        [Column("date")]
        public DateTime Date { get; private set; }

        [Required]
        [Column("choir_id")]
        public Guid ChoirId { get; private set; }

        [ForeignKey("ChoirId")]
        public Choir? Choir { get; private set; }

        [Column("playlist_template_id")]
        public Guid? PlaylistTemplateId { get; private set; }

        [ForeignKey("PlaylistTemplateId")]
        public PlaylistTemplate? PlaylistTemplate { get; private set; }

        public ICollection<PlaylistSection> Sections { get; private set; } = new List<PlaylistSection>();
        public ICollection<PlaylistTag> PlaylistTags { get; private set; } = new List<PlaylistTag>();

        private Playlist()
        {
        }

        private Playlist(string? title, Guid choirId, bool isPublic, DateTime date, Guid? playlistTemplateId)
        {
            PlaylistId = Guid.NewGuid();
            Title = title;
            ChoirId = choirId;
            IsPublic = isPublic;
            CreationDate = DateTimeOffset.UtcNow;
            Date = date;
            PlaylistTemplateId = playlistTemplateId;
        }

        public static Result<Playlist> Create(string? title, Guid choirId, bool isPublic, DateTime date, Guid? playlistTemplateId)
        {
            if (choirId == Guid.Empty)
            {
                return Result.Fail("A playlist must be associated with a choir.");
            }

            var playlist = new Playlist(title, choirId, isPublic, date, playlistTemplateId);
            return Result.Ok(playlist);
        }

        public void UpdateTitle(string? newTitle)
        {
            Title = newTitle;
        }

        public void SetVisibility(bool isPublic)
        {
            IsPublic = isPublic;
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
