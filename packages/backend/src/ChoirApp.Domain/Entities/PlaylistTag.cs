using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChoirApp.Domain.Entities
{
    [Table("PlaylistTags")]
    public class PlaylistTag
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        [Column("playlist_tag_id")]
        public Guid PlaylistTagId { get; set; }

        [Required]
        [Column("playlist_id")]
        public Guid PlaylistId { get; set; }

        [ForeignKey("PlaylistId")]
        public Playlist? Playlist { get; set; }

        [Required]
        [Column("tag_id")]
        public Guid TagId { get; set; }

        [ForeignKey("TagId")]
        public Tag? Tag { get; set; }
    }
}
