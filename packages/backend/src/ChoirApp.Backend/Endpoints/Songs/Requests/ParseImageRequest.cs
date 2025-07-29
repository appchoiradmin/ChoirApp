using Microsoft.AspNetCore.Http;

namespace ChoirApp.Backend.Endpoints.Songs.Requests
{
    public class ParseImageRequest
    {
        public IFormFile File { get; set; } = null!;
    }
}
