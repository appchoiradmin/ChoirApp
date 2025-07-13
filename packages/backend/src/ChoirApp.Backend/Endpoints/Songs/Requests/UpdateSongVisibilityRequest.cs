using ChoirApp.Application.Dtos;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class UpdateSongVisibilityRequest
    {
        public SongVisibilityType Visibility { get; set; }
    }
}
