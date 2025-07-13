using FluentResults;
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistTemplateSongs")]
    public class PlaylistTemplateSong
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("template_song_id")]
        public Guid TemplateSongId { get; private set; }

        [Required]
        [Column("order")]
        public int Order { get; private set; }

        [Required]
        [Column("template_section_id")]
        public Guid TemplateSectionId { get; private set; }

        [ForeignKey("TemplateSectionId")]
        public PlaylistTemplateSection? TemplateSection { get; private set; }

        [Column("song_id")]
        public Guid? SongId { get; private set; }

        [ForeignKey("SongId")]
        public Song? Song { get; private set; }

        private PlaylistTemplateSong() { }

        private PlaylistTemplateSong(Guid templateSectionId, int order, Guid? songId)
        {
            TemplateSongId = Guid.NewGuid();
            TemplateSectionId = templateSectionId;
            Order = order;
            SongId = songId;
        }

        public static Result<PlaylistTemplateSong> Create(Guid templateSectionId, int order, Guid? songId)
        {
            if (templateSectionId == Guid.Empty)
                return Result.Fail("A playlist template song must be associated with a section.");

            if (songId == null)
            {
                return Result.Fail("SongId must be provided.");
            }

            return Result.Ok(new PlaylistTemplateSong(templateSectionId, order, songId));
        }
    }
}
