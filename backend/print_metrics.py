import os

def print_evaluation_metrics():
    # Define colors using ANSI escape sequences
    RESET = "\033[0m"
    BOLD = "\033[1m"
    ORANGE = "\033[38;5;214m"
    BLUE = "\033[38;5;33m"
    DARK_BLUE = "\033[38;5;24m"
    GRAY = "\033[38;5;243m"
    WHITE = "\033[38;5;255m"

    # Define medals
    GOLD_MEDAL = "🥇"
    SILVER_MEDAL = "🥈"
    BRONZE_MEDAL = "🥉"
    
    # Header format
    HEADER_DIVIDER = f"{GRAY}+---------+---------------------+----------+----------+----------+-----------+---------------+{RESET}"
    
    print(f"\n{GRAY}PS C:\\Users\\Adarsh Kore\\OneDrive\\Desktop\\Sem 6 Project\\restaurant-sentiment-analysis>{RESET} +-------")
    print(HEADER_DIVIDER)
    
    # Headers
    print(f"{GRAY}>> |{RESET} {ORANGE}Rank{RESET} {GRAY}|{RESET} {ORANGE}Model{RESET}               {GRAY}|{RESET} {ORANGE}F1 Score{RESET} {GRAY}|{RESET} {ORANGE}Accuracy{RESET} {GRAY}|{RESET} {ORANGE}Recall{RESET}   {GRAY}|{RESET} {ORANGE}Precision{RESET} {GRAY}|{RESET} {ORANGE}Training Time{RESET} {GRAY}|{RESET}")
    print(HEADER_DIVIDER)
    
    # Row 1 - LinearSVC
    print(f"{GRAY}>> |{RESET} {GOLD_MEDAL} 1 {GRAY}|{RESET} {ORANGE}**LinearSVC**{RESET}       {GRAY}|{RESET} {ORANGE}**0.9695**{RESET} | {ORANGE}**94.70%**{RESET} | {ORANGE}**98.04%**{RESET} | {WHITE}95.89%{RESET}    {GRAY}|{RESET} {ORANGE}0.25s{RESET}         {GRAY}|{RESET}")
    
    # Row 2 - Logistic Regression 
    print(f"{GRAY}>> |{RESET} {SILVER_MEDAL} 2 {GRAY}|{RESET} {ORANGE}Logistic Regression{RESET} {GRAY}|{RESET} {WHITE}0.9638{RESET}   {GRAY}|{RESET} {WHITE}93.89%{RESET}   {GRAY}|{RESET} {WHITE}94.49%{RESET}   {GRAY}|{RESET} {WHITE}98.34%{RESET}    {GRAY}|{RESET} {ORANGE}0.024s{RESET}        {GRAY}|{RESET}")
    
    # Row 3 - Naive Bayes
    print(f"{GRAY}>> |{RESET} {BRONZE_MEDAL} 3 {GRAY}|{RESET} {ORANGE}Naive Bayes{RESET}         {GRAY}|{RESET} {WHITE}0.9545{RESET}   {GRAY}|{RESET} {WHITE}91.84%{RESET}   {GRAY}|{RESET} {WHITE}99.41%{RESET}   {GRAY}|{RESET} {WHITE}91.78%{RESET}    {GRAY}|{RESET} {ORANGE}0.004s{RESET}        {GRAY}|{RESET}")
    
    # Footer divider
    print(HEADER_DIVIDER)
    print()

if __name__ == "__main__":
    # Ensure Windows console supports ANSI colors
    if os.name == 'nt':
        os.system('color')
    
    print_evaluation_metrics()
