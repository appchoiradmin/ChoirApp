using System;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class RemoveTagFromSongRequest
    {
        public Guid SongId { get; set; }
        public Guid TagId { get; set; }
    }
}
