using System.Threading.Tasks;

namespace ChoirApp.Domain.Services
{
    public interface IChoirUniquenessChecker
    {
        Task<bool> IsUnique(string choirName);
    }
}
