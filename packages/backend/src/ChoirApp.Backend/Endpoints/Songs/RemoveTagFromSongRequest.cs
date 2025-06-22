using System;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class RemoveTagFromSongRequest
    {
        public Guid SongId { get; set; }
        public Guid TagId { get; set; }
    }
}
