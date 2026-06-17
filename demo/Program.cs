using System;
namespace demo
{
    class Operation
    {
        public static double Add(double a, double b)
        {
            return a + b;
        }

        public static double Subtract(double a, double b)
        {
            return a - b;
        }

        public static double Multiply(double a, double b)
        {
            return a * b;
        }

        public static double Divide(double a, double b)
        {
            if (b == 0)
                throw new DivideByZeroException("Cannot divide by zero.");
            return a / b;
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Enter first number:");
            double num1 = Convert.ToDouble(Console.ReadLine());

            Console.WriteLine("Enter second number:");
            double num2 = Convert.ToDouble(Console.ReadLine());

            Console.WriteLine("Choose an operation: +, -, *, /");
            string operation = Console.ReadLine();

            double result = 0;

            try
            {
                switch (operation)
                {
                    case "+":
                        result = Operation.Add(num1, num2);
                        break;
                    case "-":
                        result = Operation.Subtract(num1, num2);
                        break;
                    case "*":
                        result = Operation.Multiply(num1, num2);
                        break;
                    case "/":
                        result = Operation.Divide(num1, num2);
                        break;
                    default:
                        Console.WriteLine("Invalid operation.");
                        return;
                }

                Console.WriteLine($"The result of {num1} {operation} {num2} is: {result}");
            }
            catch (DivideByZeroException ex)
            {
                Console.WriteLine(ex.Message);
            }
        }
    }
}
