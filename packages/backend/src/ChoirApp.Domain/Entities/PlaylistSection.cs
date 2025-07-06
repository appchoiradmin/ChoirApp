using FluentResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistSections")]
    public class PlaylistSection
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("section_id")]
        public Guid SectionId { get; private set; }

        [Required]
        [Column("title")]
        public string Title { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("playlist_id")]
        public Guid PlaylistId { get; private set; }

        [ForeignKey("PlaylistId")]
        public Playlist? Playlist { get; private set; }

        public ICollection<PlaylistSong> PlaylistSongs { get; private set; } = new List<PlaylistSong>();

        private PlaylistSection()
        {
            Title = string.Empty;
        }

        private PlaylistSection(string title, Guid playlistId, int order)
        {
            SectionId = Guid.NewGuid();
            Title = title;
            PlaylistId = playlistId;
            Order = order;
        }

        public static Result<PlaylistSection> Create(string title, Guid playlistId, int order)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                return Result.Fail("Section title cannot be empty.");
            }

            if (playlistId == Guid.Empty)
            {
                return Result.Fail("A section must be associated with a playlist.");
            }

            var section = new PlaylistSection(title, playlistId, order);
            return Result.Ok(section);
        }

        public void UpdateTitle(string newTitle)
        {
            if (!string.IsNullOrWhiteSpace(newTitle))
            {
                Title = newTitle;
            }
        }

        public void UpdateOrder(int newOrder)
        {
            Order = newOrder;
        }
    }
}
