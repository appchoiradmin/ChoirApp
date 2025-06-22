using System;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetChoirSongVersionByIdRequest
    {
        public Guid ChoirId { get; set; }
        public Guid SongId { get; set; }
    }
}
