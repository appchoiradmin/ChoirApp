using ChoirApp.Domain.Entities;

namespace ChoirApp.Application.Contracts
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
