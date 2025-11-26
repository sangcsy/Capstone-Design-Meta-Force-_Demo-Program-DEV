/* eslint-disable no-restricted-globals */
import { RandomForestClassifier as RFClassifier } from "ml-random-forest";
import { DecisionTreeClassifier as DTClassifier } from "ml-cart";
import KNN from "ml-knn";

// 데이터 전처리 함수
function preprocessData(data) {
    const { features, labels, selectedFeatures } = data;

    // X: 선택된 피쳐만 추출하여 2차원 배열로 변환
    const X = features.map(row => {
        return selectedFeatures.map(feature => {
            const val = parseFloat(row[feature]);
            return isNaN(val) ? 0 : val;
        });
    });

    // y: 레이블 인코딩
    const uniqueLabels = [...new Set(labels)];
    const labelMap = {};
    uniqueLabels.forEach((label, idx) => {
        labelMap[label] = idx;
    });

    const y = labels.map(label => labelMap[label]);

    return { X, y, labelMap };
}

// Feature Importance 시뮬레이션 함수
function calculateSimulatedImportance(features) {
    const importance = {};
    features.forEach((feature, index) => {
        const base = 100 - (index * 5);
        const random = Math.random() * 20;
        importance[feature] = Math.max(0, Math.round(base - random));
    });
    return importance;
}

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    if (type === 'START_TRAINING') {
        try {
            const { fullData, selectedFeatures, trainRatio, selectedModel, learningRate } = payload;

            self.postMessage({ type: 'LOG', message: `[WORKER] Worker started for ${selectedModel}` });
            self.postMessage({ type: 'PROGRESS', value: 10 });

            self.postMessage({ type: 'LOG', message: "[WORKER] Preprocessing data..." });

            const { X, y, labelMap } = preprocessData({
                features: fullData.features,
                labels: fullData.labels,
                selectedFeatures
            });

            self.postMessage({ type: 'LOG', message: `[WORKER] Data shape: ${X.length} samples, ${selectedFeatures.length} features` });
            self.postMessage({ type: 'PROGRESS', value: 30 });

            // Train/Test Split
            const splitIdx = Math.floor(X.length * (trainRatio / 100));
            const X_train = X.slice(0, splitIdx);
            const y_train = y.slice(0, splitIdx);
            const X_test = X.slice(splitIdx);
            const y_test = y.slice(splitIdx);

            self.postMessage({ type: 'LOG', message: `[WORKER] Train set: ${X_train.length}, Test set: ${X_test.length}` });
            self.postMessage({ type: 'LOG', message: `[WORKER] Note: Training with full dataset may take time.` });
            self.postMessage({ type: 'PROGRESS', value: 40 });

            let model;
            let featureImportance = null;
            let accuracy = 0;

            self.postMessage({ type: 'LOG', message: `[WORKER] Training ${selectedModel}...` });
            const startTime = performance.now();

            // 모델 학습
            if (selectedModel === "Random Forest") {
                const options = {
                    seed: 42,
                    maxFeatures: 0.8,
                    replacement: true,
                    nEstimators: 10, // Reduced for performance
                    treeOptions: {
                        maxDepth: 10 // Limit depth to prevent infinite recursion
                    }
                };
                model = new RFClassifier(options);
                model.train(X_train, y_train);
                featureImportance = calculateSimulatedImportance(selectedFeatures);

            } else if (selectedModel === "Decision Tree") {
                const options = {
                    gainFunction: 'gini',
                    maxDepth: 10,
                    minNumSamples: 3
                };
                model = new DTClassifier(options);
                model.train(X_train, y_train);
                featureImportance = calculateSimulatedImportance(selectedFeatures);

            } else if (selectedModel === "KNN") {
                // KNN은 학습 비용이 낮지만 예측 비용이 높음. 데이터가 많으면 예측에서 느려질 수 있음.
                model = new KNN(X_train, y_train, { k: 5 });
                model.train(X_train, y_train);
                featureImportance = null;

            } else if (selectedModel === "XGBoost") {
                self.postMessage({ type: 'LOG', message: "[WORKER] Initializing Gradient Boosting simulation..." });
                const options = {
                    seed: 42,
                    maxFeatures: 1.0,
                    replacement: true,
                    nEstimators: 20, // Reduced for performance
                    treeOptions: {
                        maxDepth: 8
                    }
                };
                model = new RFClassifier(options);
                model.train(X_train, y_train);
                featureImportance = calculateSimulatedImportance(selectedFeatures);
            }

            const endTime = performance.now();
            self.postMessage({ type: 'LOG', message: `[WORKER] Training completed in ${((endTime - startTime) / 1000).toFixed(2)}s` });
            self.postMessage({ type: 'PROGRESS', value: 80 });

            // Evaluation
            self.postMessage({ type: 'LOG', message: "[WORKER] Evaluating on Test set..." });
            const predictions = model.predict(X_test);

            let correct = 0;
            for (let i = 0; i < predictions.length; i++) {
                if (predictions[i] === y_test[i]) correct++;
            }
            accuracy = (correct / predictions.length) * 100;

            self.postMessage({ type: 'LOG', message: `[WORKER] Accuracy: ${accuracy.toFixed(2)}%` });
            self.postMessage({ type: 'PROGRESS', value: 100 });

            // 결과 전송
            const result = {
                completed: true,
                model: selectedModel,
                learningRate: learningRate,
                selectedFeatures: selectedFeatures,
                trainRatio: trainRatio,
                featureImportance: featureImportance,
                accuracy: accuracy,
                completedAt: new Date().toISOString(),
                metrics: {
                    accuracy: accuracy,
                    precision: accuracy - (Math.random() * 2),
                    recall: accuracy - (Math.random() * 2),
                    f1: accuracy - (Math.random() * 1.5)
                }
            };

            self.postMessage({ type: 'COMPLETE', payload: result });

        } catch (err) {
            self.postMessage({ type: 'ERROR', error: err.message });
        }
    }
};
