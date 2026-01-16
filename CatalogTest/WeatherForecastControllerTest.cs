using Catalogs.Controllers;
using Microsoft.Extensions.Logging.Abstractions;

namespace CatalogTest
{
    public class WeatherForecastControllerTest
    {
        [Fact]
        public void Get_ReturnsFiveForecasts()
        {
            // Arrange
            var logger = new NullLogger<WeatherForecastController>();
            var controller = new WeatherForecastController(logger);

            // Act
            var result = controller.Get();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(5, result.Count());
            Assert.All(result, item => Assert.NotNull(item.Summary));

        }
    }
}