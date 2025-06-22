namespace ChoirApp.Backend.Endpoints.Songs
{
    public class SearchSongsRequest
    {
        public string? Title { get; set; }
        public string? Artist { get; set; }
        public string? Tag { get; set; }
    }
}
