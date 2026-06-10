import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import os


class CodeBERTClassifier:
    def __init__(self):
        model_name=os.getenv("MODEL_NAME","microsoft/codebert-base")
        # load the tokenizer and model
        self.tokenizer=AutoTokenizer.from_pretrained(model_name)
        self.model=AutoModelForSequenceClassification.from_pretrained(model_name,num_labels=2,ignore_mismatched_sizes=True)

        self.model.eval() # set to evaluation mode
        self.device=torch.device("cuda") if torch.cuda.is_available() else torch.device("cpu")
        self.model.to(self.device)
        print(f"Running on: {self.device}")


    def predict(self,code:str)->tuple:
        inputs=self.tokenizer(code,truncation=True,return_tensors="pt",max_length=512,padding="max_length")
        inputs={k:v.to(self.device) for k,v in inputs.items()}
        with torch.no_grad():
            outputs=self.model(**inputs)
        probs=torch.softmax(outputs.logits,dim=1)
        bug_prob=probs[0][1].item()  # probability of "bug" class
        clean_prob=probs[0][0].item() # probability of "clean" class
        label="bug" if bug_prob>clean_prob else "clean"
        confidence=bug_prob if label=="bug" else clean_prob
        return label,confidence

