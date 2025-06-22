using System;

namespace ChoirApp.Backend.Endpoints.Songs
{
    public class GetChoirSongVersionsRequest
    {
        public Guid ChoirId { get; set; }
    }
}
