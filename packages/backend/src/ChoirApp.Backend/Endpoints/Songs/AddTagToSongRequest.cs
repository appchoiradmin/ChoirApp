using System;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class AddTagToSongRequest
    {
        public Guid SongId { get; set; }
        public string TagName { get; set; } = null!;
    }
}
